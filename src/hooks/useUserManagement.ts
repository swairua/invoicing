import { useState, useEffect } from 'react';
import { getDatabase } from '@/integrations/database';
import { useAuth, UserProfile, UserRole, UserStatus } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { parseErrorMessage, parseErrorMessageWithCodes } from '@/utils/errorHelpers';
import { logUserCreation, logUserApproval } from '@/utils/auditLogger';

export interface UserInvitation {
  id: string;
  email: string;
  role: UserRole;
  company_id: string;
  invited_by: string;
  invited_at: string;
  expires_at: string;
  accepted_at?: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  invitation_token: string;
  is_approved?: boolean;
  approved_by?: string;
  approved_at?: string;
}

export interface CreateUserData {
  email: string;
  full_name?: string;
  role: UserRole;
  phone?: string;
  department?: string;
  position?: string;
  password?: string; // optional: admin can set password directly
  company_id?: string; // optional: super-admin can assign company when creating users
}

export interface UpdateUserData {
  full_name?: string;
  role?: UserRole;
  status?: UserStatus;
  phone?: string;
  department?: string;
  position?: string;
}

export const useUserManagement = () => {
  const { profile: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all users in the same company
  const fetchUsers = async () => {
    if (!isAdmin) {
      console.log('fetchUsers: User is not admin, skipping fetch');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching users for company:', currentUser?.company_id);
      const db = getDatabase();

      // Build filter based on company_id if user has one
      let filter: Record<string, any> = {};
      if (currentUser?.company_id) {
        filter.company_id = currentUser.company_id;
      }

      const { data, error } = await db.select('profiles', filter);

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      console.log('Fetched users:', data?.length || 0, 'users');
      setUsers((data || []) as UserProfile[]);
    } catch (err) {
      console.error('Error fetching users:', err);
      let errorMessage = 'Unknown error occurred';
      try {
        errorMessage = parseErrorMessage(err);
      } catch (parseErr) {
        console.error('parseErrorMessage failed for fetchUsers:', parseErr);
        errorMessage = err?.message || String(err);
      }

      // Ensure string and try JSON stringify for objects
      if (typeof errorMessage !== 'string') {
        try {
          errorMessage = JSON.stringify(errorMessage);
        } catch (jsonErr) {
          errorMessage = String(errorMessage);
        }
      }

      setError(`Failed to fetch users: ${errorMessage}`);
      toast.error(`Error fetching users: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending invitations
  const fetchInvitations = async () => {
    if (!isAdmin) {
      return;
    }

    try {
      const db = getDatabase();
      const filter: Record<string, any> = {};

      if (currentUser?.company_id) {
        filter.company_id = currentUser.company_id;
      }

      const result = await db.selectBy('user_invitations', filter);

      if (result.error) {
        throw result.error;
      }

      setInvitations(result.data || []);
    } catch (err) {
      console.error('Error fetching invitations:', err);

      // Ensure we get a proper string error message
      let errorMessage = 'Unknown error occurred';
      try {
        errorMessage = parseErrorMessage(err);
      } catch (parseErr) {
        console.error('Error parsing error message for invitations:', parseErr);
        errorMessage = err?.message || String(err) || 'Failed to parse error';
      }

      if (typeof errorMessage !== 'string') {
        try {
          errorMessage = JSON.stringify(errorMessage);
        } catch (jsonErr) {
          errorMessage = String(errorMessage);
        }
      }

      setError(`Failed to fetch invitations: ${errorMessage}`);
      toast.error(`Error fetching invitations: ${errorMessage}`);
    }
  };

  // Create a new user (admin only) - Creates fully qualified user via admin edge function
  const createUser = async (userData: CreateUserData): Promise<{ success: boolean; password?: string; error?: string }> => {
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized: Only administrators can create users' };
    }

    if (!userData.password || userData.password.length < 8) {
      return { success: false, error: 'Password is required (min 8 characters)' };
    }

    setLoading(true);

    try {
      const db = getDatabase();

      // Check if user already exists in profiles
      const existingUserResult = await db.selectBy('profiles', { email: userData.email });
      if (existingUserResult.data && existingUserResult.data.length > 0) {
        return { success: false, error: 'User with this email already exists' };
      }

      const companyToSet = userData.company_id || currentUser?.company_id;

      // If no company is provided, try to get the first company
      let finalCompanyId = companyToSet;
      if (!finalCompanyId) {
        const companiesResult = await db.selectBy('companies', {});
        if (companiesResult.data && companiesResult.data.length > 0) {
          finalCompanyId = companiesResult.data[0].id;
        }
      }

      if (!finalCompanyId) {
        return { success: false, error: 'No company available. Please create a company first.' };
      }

      // Validate that the company actually exists
      const companyCheckResult = await db.selectOne('companies', finalCompanyId);
      if (companyCheckResult.error || !companyCheckResult.data) {
        return { success: false, error: 'The selected company no longer exists. Please refresh and try again.' };
      }

      // Validate that admin can create users in this company (if not super-admin)
      if (currentUser?.company_id && currentUser.company_id !== finalCompanyId) {
        return { success: false, error: 'You can only create users for your own company' };
      }

      // If password is provided, create the user directly using the API endpoint
      if (userData.password) {
        try {
          const response = await fetch('/api/admin/users/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: userData.email,
              password: userData.password,
              full_name: userData.full_name,
              role: userData.role,
              company_id: finalCompanyId,
              invited_by: currentUser?.id,
              phone: userData.phone,
              department: userData.department,
              position: userData.position,
            }),
          });

          // Defensively parse JSON
          const result = await response.json().catch(() => {
            if (!response.ok) {
              throw new Error(`Server error: HTTP ${response.status}. Failed to create user.`);
            }
            throw new Error('Invalid response from server: Expected valid JSON');
          });

          if (!response.ok) {
            console.error('API error:', result);
            return { success: false, error: result.error || 'Failed to create user' };
          }

          if (!result.success) {
            return { success: false, error: result.error || 'Failed to create user' };
          }

          // Log user creation in audit trail
          try {
            await logUserCreation(result.user_id, userData.email, userData.role as UserRole, finalCompanyId);
          } catch (auditError) {
            console.error('Failed to log user creation:', auditError);
          }

          toast.success(`User ${userData.email} created successfully and is ready to login.`);
          await fetchUsers();
          return { success: true, password: userData.password };
        } catch (err) {
          console.error('Error calling user creation API:', err);
          return { success: false, error: `Failed to create user: ${err instanceof Error ? err.message : String(err)}` };
        }
      }

      // If no password provided, create an invitation instead
      const existingInvitationsResult = await db.selectBy('user_invitations', {
        email: userData.email,
        company_id: finalCompanyId
      });

      let invitation: any = null;
      if (existingInvitationsResult.data && existingInvitationsResult.data.length > 0) {
        const pendingInv = existingInvitationsResult.data.find((inv: any) => inv.status === 'pending' || inv.status === 'accepted');
        if (pendingInv) {
          invitation = pendingInv;
        }
      }

      // If no existing pending/accepted invitation, create a new one
      if (!invitation) {
        const inviteData = {
          email: userData.email,
          role: userData.role,
          company_id: finalCompanyId,
          invited_by: currentUser?.id,
          is_approved: true,
          approved_by: currentUser?.id,
          approved_at: new Date().toISOString(),
        };

        const inviteResult = await db.insert('user_invitations', inviteData);

        if (inviteResult.error) {
          console.error('Invitation creation error:', inviteResult.error);
          return { success: false, error: `Failed to create invitation: ${inviteResult.error.message || 'Unknown error'}` };
        }

        if (!inviteResult.id) {
          return { success: false, error: 'Failed to create invitation' };
        }

        const selectResult = await db.selectOne('user_invitations', inviteResult.id);
        if (selectResult.error) {
          return { success: false, error: 'Failed to fetch created invitation' };
        }

        invitation = selectResult.data;
      } else {
        // Update existing invitation to ensure it's approved and current role is set
        const updateResult = await db.update('user_invitations', invitation.id, {
          role: userData.role,
          is_approved: true,
          approved_by: currentUser?.id,
          approved_at: new Date().toISOString(),
        });

        if (updateResult.error) {
          console.warn('Failed to update existing invitation:', updateResult.error);
          // Continue anyway - invitation still exists and is usable
        }
      }

      // Log user creation in audit trail
      try {
        if (invitation?.id) {
          await logUserCreation(invitation.id, userData.email, userData.role as UserRole, finalCompanyId);
        }
      } catch (auditError) {
        console.error('Failed to log user creation:', auditError);
      }

      toast.success(`Pre-approved invitation ready for ${userData.email}. User can sign up and will be immediately active.`);
      await fetchInvitations();

      return { success: true, password: userData.password };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'user creation');
      console.error('Error creating user:', errorMessage, err);
      toast.error(`Failed to create user: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update user (admin only)
  const updateUser = async (userId: string, userData: UpdateUserData): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      toast.error('You do not have permission to update users');
      return { success: false, error: 'Unauthorized' };
    }

    setLoading(true);

    try {
      console.log('Attempting to update user via external API:', { userId, userData });

      const db = getDatabase();
      const { error } = await db.update('profiles', userId, userData);

      if (error) {
        console.error('Database returned error:', error);
        throw error;
      }

      console.log('User updated successfully');
      toast.success('User updated successfully');
      await fetchUsers();
      return { success: true };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'user update');
      console.error('Error updating user:', err);
      console.error('Full error object:', JSON.stringify(err, null, 2));
      toast.error(`Failed to update user: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Delete user (admin only)
  const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin || userId === currentUser?.id) {
      return { success: false, error: 'Cannot delete yourself or unauthorized' };
    }

    setLoading(true);

    try {
      const db = getDatabase();

      // Delete from profiles table - this will cascade to auth.users if foreign key is set
      const deleteResult = await db.delete('profiles', userId);

      if (deleteResult.error) {
        throw deleteResult.error;
      }

      toast.success('User deleted successfully');
      await fetchUsers();
      return { success: true };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'user deletion');
      console.error('Error deleting user:', err);
      toast.error(`Failed to delete user: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Invite user via email
  const inviteUser = async (email: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin || !currentUser?.company_id) {
      return { success: false, error: 'Unauthorized' };
    }

    setLoading(true);

    try {
      const db = getDatabase();

      // Validate that the company still exists
      const companyResult = await db.selectOne('companies', currentUser.company_id);
      if (companyResult.error || !companyResult.data) {
        return { success: false, error: 'Your company no longer exists in the system. Please contact support.' };
      }

      // Validate that the current user (inviter) still exists
      const inviterResult = await db.selectOne('profiles', currentUser.id);
      if (inviterResult.error || !inviterResult.data) {
        return { success: false, error: 'Your user profile no longer exists. Please sign in again.' };
      }

      // Check if user already exists or has pending invitation
      const existingUserResult = await db.selectBy('profiles', { email });
      if (existingUserResult.data && existingUserResult.data.length > 0) {
        return { success: false, error: 'User with this email already exists' };
      }

      const existingInvitationResult = await db.selectBy('user_invitations', {
        email,
        company_id: currentUser.company_id,
        status: 'pending'
      });

      if (existingInvitationResult.data && existingInvitationResult.data.length > 0) {
        return { success: false, error: 'Invitation already sent to this email' };
      }

      // Create invitation
      const inviteData = {
        email,
        role,
        company_id: currentUser.company_id,
        invited_by: currentUser.id,
        is_approved: true,
        approved_by: currentUser.id,
        approved_at: new Date().toISOString(),
      };

      const inviteResult = await db.insert('user_invitations', inviteData);
      if (inviteResult.error) {
        throw inviteResult.error;
      }

      if (!inviteResult.id) {
        return { success: false, error: 'Failed to create invitation' };
      }

      const selectResult = await db.selectOne('user_invitations', inviteResult.id);
      if (selectResult.error) {
        return { success: false, error: 'Failed to fetch created invitation' };
      }

      const invitation = selectResult.data;

      // Log user invitation in audit trail
      try {
        if (invitation) {
          await logUserCreation(invitation.id, email, role, currentUser.company_id);
        }
      } catch (auditError) {
        console.error('Failed to log user invitation to audit trail:', auditError);
        // Don't fail the operation if audit logging fails
      }

      toast.success('User invitation created and approved');
      await fetchInvitations();
      return { success: true };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'invitation');
      console.error('Error creating invitation:', err);
      toast.error(`Failed to create invitation: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Revoke invitation
  const revokeInvitation = async (invitationId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    setLoading(true);

    try {
      const db = getDatabase();
      const result = await db.update('user_invitations', invitationId, { status: 'revoked' });

      if (result.error) {
        throw result.error;
      }

      toast.success('Invitation revoked successfully');
      await fetchInvitations();
      return { success: true };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'invitation revocation');
      console.error('Error revoking invitation:', err);
      toast.error(`Failed to revoke invitation: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Delete invitation permanently
  const deleteInvitation = async (invitationId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    setLoading(true);

    try {
      const db = getDatabase();
      const result = await db.delete('user_invitations', invitationId);

      if (result.error) {
        throw result.error;
      }

      toast.success('Invitation deleted successfully');
      await fetchInvitations();
      return { success: true };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'invitation deletion');
      console.error('Error deleting invitation:', err);
      toast.error(`Failed to delete invitation: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Accept invitation (for invited users)
  const acceptInvitation = async (token: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const db = getDatabase();

      const invitationResult = await db.selectBy('user_invitations', {
        invitation_token: token,
        status: 'pending'
      });

      if (invitationResult.error || !invitationResult.data || invitationResult.data.length === 0) {
        return { success: false, error: 'Invalid or expired invitation' };
      }

      const invitation = invitationResult.data[0];

      // Check if invitation has been approved by admin
      if (!invitation.is_approved) {
        return { success: false, error: 'This invitation is pending admin approval. Please wait for your administrator to approve your account.' };
      }

      // Check if invitation has expired
      if (new Date(invitation.expires_at) < new Date()) {
        await db.update('user_invitations', invitation.id, { status: 'expired' });
        return { success: false, error: 'Invitation has expired' };
      }

      // Mark invitation as accepted
      const updateResult = await db.update('user_invitations', invitation.id, {
        status: 'accepted',
        accepted_at: new Date().toISOString()
      });

      if (updateResult.error) {
        throw updateResult.error;
      }

      return { success: true };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'invitation acceptance');
      console.error('Error accepting invitation:', err);
      return { success: false, error: errorMessage };
    }
  };

  // Promote all existing users to admin (dangerous - admin only)
  const promoteAllToAdmin = async (): Promise<{ success: boolean; count?: number; error?: string }> => {
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    setLoading(true);
    try {
      const db = getDatabase();
      let totalUpdated = 0;

      // Get all users with null or non-admin roles
      const usersResult = await db.selectBy('profiles', {});
      if (usersResult.error) {
        throw usersResult.error;
      }

      const usersToUpdate = usersResult.data?.filter((u: any) => !u.role || u.role !== 'admin') || [];

      // Update each user to admin role
      for (const user of usersToUpdate) {
        const updateResult = await db.update('profiles', user.id, { role: 'admin' });
        if (!updateResult.error) {
          totalUpdated++;
        }
      }

      toast.success(`Promoted ${totalUpdated} users to admin`);
      await fetchUsers();
      return { success: true, count: totalUpdated };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'promote all');
      console.error('Error promoting users:', err);
      toast.error(`Failed to promote users: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Complete invitation by creating user account (admin only)
  const completeInvitation = async (
    invitationId: string,
    userData: {
      password: string;
      full_name?: string;
      phone?: string;
      department?: string;
      position?: string;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!userData.password || userData.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }

    setLoading(true);

    try {
      const db = getDatabase();

      // Get invitation details first
      const invitationResult = await db.selectOne('user_invitations', invitationId);
      if (invitationResult.error || !invitationResult.data) {
        return { success: false, error: 'Invitation not found' };
      }

      const invitationData = invitationResult.data;
      if (invitationData.status !== 'pending') {
        return { success: false, error: `Invitation is already ${invitationData.status}` };
      }

      // Validate that the company still exists
      const companyResult = await db.selectOne('companies', invitationData.company_id);
      if (companyResult.error || !companyResult.data) {
        return { success: false, error: 'The associated company no longer exists' };
      }

      // Check if a profile already exists for this email
      const profilesResult = await db.selectBy('profiles', { email: invitationData.email });
      if (profilesResult.error || !profilesResult.data || profilesResult.data.length === 0) {
        return {
          success: false,
          error: 'User profile not found. Please ask the user to sign up first, or use the "Add User" button to create a complete user account directly.'
        };
      }

      const userId = profilesResult.data[0].id;

      // Update existing profile
      const updateData = {
        status: 'active',
        role: invitationData.role,
        company_id: invitationData.company_id,
        invited_by: invitationData.invited_by,
        invited_at: invitationData.invited_at,
        full_name: userData.full_name || undefined,
        phone: userData.phone || undefined,
        department: userData.department || undefined,
        position: userData.position || undefined,
        password: userData.password, // Will be hashed by DB trigger
      };

      const updateResult = await db.update('profiles', userId, updateData);

      if (updateResult.error) {
        const errorMsg = parseErrorMessageWithCodes(updateResult.error, 'profile update');
        console.error('Profile update error:', updateResult.error);
        return { success: false, error: errorMsg };
      }

      // Mark invitation as accepted
      const acceptResult = await db.update('user_invitations', invitationId, {
        status: 'accepted',
        accepted_at: new Date().toISOString()
      });

      if (acceptResult.error) {
        console.error('Error marking invitation as accepted:', acceptResult.error);
        // Don't fail the operation if marking as accepted fails - user is already created
      }

      // Log in audit trail
      try {
        await logUserApproval(invitationId, invitationData.email, invitationData.company_id, 'completed');
      } catch (auditError) {
        console.error('Failed to log in audit trail:', auditError);
        // Don't fail the operation if audit logging fails
      }

      toast.success(`User account created for ${invitationData.email}`);
      await fetchInvitations();
      await fetchUsers();
      return { success: true };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'invitation completion');
      console.error('Error completing invitation:', err);
      toast.error(`Failed to complete invitation: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Approve invitation (admin only)
  const approveInvitation = async (invitationId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    setLoading(true);

    try {
      const db = getDatabase();

      // Get invitation details first for audit logging
      const invitationResult = await db.selectOne('user_invitations', invitationId);
      const invitationData = invitationResult.data;

      const updateResult = await db.update('user_invitations', invitationId, {
        is_approved: true,
        approved_by: currentUser?.id,
        approved_at: new Date().toISOString()
      });

      if (updateResult.error) {
        throw updateResult.error;
      }

      // If a profile already exists for this email (user already signed up), activate it and assign role/company
      try {
        if (invitationData?.email) {
          const profileResult = await db.selectBy('profiles', { email: invitationData.email });

          if (profileResult.data && profileResult.data.length > 0) {
            const profileExists = profileResult.data[0];

            // Validate that the company still exists before updating
            if (invitationData.company_id) {
              const companyResult = await db.selectOne('companies', invitationData.company_id);

              if (companyResult.error || !companyResult.data) {
                console.warn('Cannot activate profile: company no longer exists', {
                  profileId: profileExists.id,
                  companyId: invitationData.company_id
                });
                return;
              }
            }

            const updateProfileResult = await db.update('profiles', profileExists.id, {
              status: 'active',
              role: invitationData.role,
              company_id: invitationData.company_id
            });

            if (updateProfileResult.error) {
              console.warn('Could not auto-activate existing profile on approval:', {
                error: updateProfileResult.error,
                profileId: profileExists.id,
                invitationId: invitationId
              });
            }
          }
        }
      } catch (profileActivateErr) {
        console.warn('Could not auto-activate existing profile on approval:', profileActivateErr);
      }

      // Log approval in audit trail
      try {
        if (invitationData) {
          await logUserApproval(invitationId, invitationData.email, invitationData.company_id, 'approved');
        }
      } catch (auditError) {
        console.error('Failed to log approval to audit trail:', auditError);
      }

      toast.success('Invitation approved successfully');
      await fetchInvitations();
      await fetchUsers();
      return { success: true };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'invitation approval');
      console.error('Error approving invitation:', err);
      toast.error(`Failed to approve invitation: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Get user statistics
  const getUserStats = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const pendingUsers = users.filter(u => u.status === 'pending').length;
    const inactiveUsers = users.filter(u => u.status === 'inactive').length;

    const adminUsers = users.filter(u => u.role === 'admin').length;
    const accountantUsers = users.filter(u => u.role === 'accountant').length;
    const stockManagerUsers = users.filter(u => u.role === 'stock_manager').length;
    const basicUsers = users.filter(u => u.role === 'user').length;

    const pendingInvitations = invitations.filter(i => !i.is_approved).length;

    return {
      totalUsers,
      activeUsers,
      pendingUsers,
      inactiveUsers,
      adminUsers,
      accountantUsers,
      stockManagerUsers,
      basicUsers,
      pendingInvitations,
    };
  };

  // Reset user password (admin only) - sends password reset email
  const resetUserPassword = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized' };
    }

    setLoading(true);

    try {
      const user = users.find(u => u.id === userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Call API endpoint to send password reset email
      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          user_id: userId,
          admin_id: currentUser?.id,
        })
      });

      // Defensively parse JSON
      const data = await response.json().catch(() => {
        if (!response.ok) {
          throw new Error(`Server error: HTTP ${response.status}. Failed to send password reset email.`);
        }
        throw new Error('Invalid response from server: Expected valid JSON');
      });

      if (!response.ok) {
        const errorMessage = parseErrorMessageWithCodes(data.error, 'password reset');
        return { success: false, error: errorMessage || 'Failed to send password reset email' };
      }

      if (data && !data.success) {
        return { success: false, error: data.error || 'Failed to send password reset email' };
      }

      toast.success(`Password reset email sent to ${user.email}`);
      return { success: true };
    } catch (err) {
      const errorMessage = parseErrorMessageWithCodes(err, 'password reset');
      console.error('Error resetting password:', errorMessage, err);
      toast.error(`Failed to reset password: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchInvitations();
    }
  }, [isAdmin]);

  return {
    users,
    invitations,
    loading,
    error,
    fetchUsers,
    fetchInvitations,
    createUser,
    updateUser,
    deleteUser,
    inviteUser,
    revokeInvitation,
    deleteInvitation,
    approveInvitation,
    acceptInvitation,
    completeInvitation,
    resetUserPassword,
    getUserStats,
    promoteAllToAdmin,
  };
};

// Helper function to generate temporary password
const generateTemporaryPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export default useUserManagement;

/**
 * Company Access Logger Utility
 * Logs unauthorized company access attempts for audit trail
 * 
 * This utility provides centralized audit logging for RBAC violations
 * in company isolation enforcement.
 */

import { apiClient } from '@/integrations/api';

export interface UnauthorizedAccessLog {
  userId: string;
  userEmail: string;
  userCompanyId: string;
  attemptedCompanyId: string;
  timestamp: string;
  action: 'UNAUTHORIZED_COMPANY_ACCESS';
  details?: Record<string, any>;
}

/**
 * Logs an unauthorized company access attempt to the audit_logs table
 * Called when a non-admin user attempts to access a company they don't have permission for
 * 
 * @param userId - The user attempting access
 * @param userEmail - The user's email for audit trail
 * @param userCompanyId - The user's assigned company
 * @param attemptedCompanyId - The company they tried to access
 * @param details - Optional additional details to log
 */
export async function logUnauthorizedCompanyAccess(
  userId: string,
  userEmail: string,
  userCompanyId: string,
  attemptedCompanyId: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    const logEntry: UnauthorizedAccessLog = {
      userId,
      userEmail,
      userCompanyId,
      attemptedCompanyId,
      timestamp: new Date().toISOString(),
      action: 'UNAUTHORIZED_COMPANY_ACCESS',
      details
    };

    console.log('[AUDIT] Unauthorized company access attempt', logEntry);

    // Insert audit log to database
    // This will be enabled when the audit_logs table is available
    // and permissions are configured properly
    try {
      // Check if audit_logs table exists and we have permission to write to it
      const { error } = await apiClient.insert('audit_logs', {
        user_id: userId,
        action: 'UNAUTHORIZED_COMPANY_ACCESS',
        resource: 'company',
        resource_id: attemptedCompanyId,
        details: {
          userEmail,
          userCompanyId,
          attemptedCompanyId,
          ...details
        },
        created_at: new Date().toISOString()
      });

      if (error) {
        console.warn('[AUDIT] Failed to log to database:', error.message);
        // Continue - don't block app functionality if audit logging fails
      } else {
        console.log('[AUDIT] Access attempt logged successfully');
      }
    } catch (insertError) {
      // API call failed or audit_logs table doesn't exist yet
      console.warn('[AUDIT] Could not insert audit log:', insertError instanceof Error ? insertError.message : 'Unknown error');
      // This is a fallback - the console log above already captured the attempt
    }
  } catch (error) {
    console.error('[AUDIT] Error logging unauthorized access:', error);
    // Silently fail - don't let logging errors break the application
  }
}

/**
 * Logs a successful company switch by a user (for audit trail)
 * 
 * @param userId - The user switching companies
 * @param fromCompanyId - The company they switched from
 * @param toCompanyId - The company they switched to
 * @param details - Optional additional details
 */
export async function logCompanySwitch(
  userId: string,
  fromCompanyId: string | null,
  toCompanyId: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    console.log('[AUDIT] User switched companies', {
      timestamp: new Date().toISOString(),
      userId,
      fromCompanyId,
      toCompanyId,
      action: 'COMPANY_SWITCH'
    });

    // Optional: Insert to audit_logs when enabled
    // await apiClient.insert('audit_logs', {
    //   user_id: userId,
    //   action: 'COMPANY_SWITCH',
    //   resource: 'company',
    //   resource_id: toCompanyId,
    //   details: {
    //     fromCompanyId,
    //     toCompanyId,
    //     ...details
    //   }
    // });
  } catch (error) {
    console.error('[AUDIT] Error logging company switch:', error);
  }
}

/**
 * Logs when a user views company data (for audit trail)
 * Can be used for compliance and security auditing
 * 
 * @param userId - The user viewing data
 * @param companyId - The company being accessed
 * @param resourceType - Type of resource being accessed (e.g., 'customers', 'products')
 * @param details - Optional additional details
 */
export async function logCompanyDataAccess(
  userId: string,
  companyId: string,
  resourceType: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    console.log('[AUDIT] User accessed company data', {
      timestamp: new Date().toISOString(),
      userId,
      companyId,
      resourceType,
      action: 'COMPANY_DATA_ACCESS'
    });

    // Optional: Insert to audit_logs when enabled
    // await apiClient.insert('audit_logs', {
    //   user_id: userId,
    //   action: 'COMPANY_DATA_ACCESS',
    //   resource: resourceType,
    //   resource_id: companyId,
    //   details: {
    //     resourceType,
    //     ...details
    //   }
    // });
  } catch (error) {
    console.error('[AUDIT] Error logging data access:', error);
  }
}

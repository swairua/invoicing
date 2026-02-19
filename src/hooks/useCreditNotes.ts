import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDatabase } from '@/integrations/database';
import { toast } from 'sonner';
import { getCurrentUser } from '@/utils/getCurrentUser';

// Initialize database adapter for use throughout the hook
const db = getDatabase();

export interface CreditNote {
  id: string;
  company_id: string;
  customer_id: string;
  invoice_id?: string;
  credit_note_number: string;
  credit_note_date: string;
  status: 'draft' | 'sent' | 'applied' | 'cancelled';
  reason?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  applied_amount: number;
  balance: number;
  affects_inventory: boolean;
  notes?: string;
  terms_and_conditions?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  customers?: {
    name: string;
    email?: string;
    phone?: string;
    customer_code: string;
  };
  credit_note_items?: CreditNoteItem[];
  invoices?: {
    invoice_number: string;
    total_amount: number;
  };
}

export interface CreditNoteItem {
  id: string;
  credit_note_id: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_percentage: number;
  tax_amount: number;
  tax_inclusive: boolean;
  tax_setting_id?: string;
  line_total: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  products?: {
    name: string;
    product_code: string;
    unit_of_measure: string;
  };
}

export interface CreditNoteAllocation {
  id: string;
  credit_note_id: string;
  invoice_id: string;
  allocated_amount: number;
  allocation_date: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

// Fetch all credit notes for a company
export function useCreditNotes(companyId: string | undefined) {
  return useQuery({
    queryKey: ['creditNotes', companyId],
    queryFn: async () => {
      if (!companyId) throw new Error('Company ID is required');

      const result = await db.selectBy('credit_notes', { company_id: companyId });

      if (result.error) throw result.error;
      return (result.data || []) as CreditNote[];
    },
    enabled: !!companyId,
  });
}

// Fetch credit notes for a specific customer
export function useCustomerCreditNotes(customerId: string | undefined, companyId: string | undefined) {
  return useQuery({
    queryKey: ['customerCreditNotes', customerId, companyId],
    queryFn: async () => {
      if (!customerId || !companyId) throw new Error('Customer ID and Company ID are required');

      const result = await db.selectBy('credit_notes', { customer_id: customerId, company_id: companyId });

      if (result.error) throw result.error;
      return (result.data || []) as CreditNote[];
    },
    enabled: !!customerId && !!companyId,
  });
}

// Fetch a single credit note by ID
export function useCreditNote(creditNoteId: string | undefined) {
  return useQuery({
    queryKey: ['creditNote', creditNoteId],
    queryFn: async () => {
      if (!creditNoteId) throw new Error('Credit Note ID is required');

      const result = await db.selectOne('credit_notes', creditNoteId);

      if (result.error) throw result.error;
      return result.data as CreditNote;
    },
    enabled: !!creditNoteId,
  });
}

// Create a new credit note
export function useCreateCreditNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (creditNote: Omit<CreditNote, 'id' | 'created_at' | 'updated_at'>) => {
      const result = await db.insert('credit_notes', creditNote);

      if (result.error) throw result.error;
      if (!result.id) throw new Error('Failed to create credit note: no ID returned');

      const selectResult = await db.selectOne('credit_notes', result.id);
      if (selectResult.error) throw selectResult.error;
      return selectResult.data as CreditNote;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['creditNotes'] });
      queryClient.invalidateQueries({ queryKey: ['customerCreditNotes'] });
      toast.success(`Credit note ${data.credit_note_number} created successfully!`);
    },
    onError: (error: any) => {
      console.error('Error creating credit note:', error);
      toast.error('Failed to create credit note. Please try again.');
    },
  });
}

// Update an existing credit note
export function useUpdateCreditNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreditNote> }) => {
      const result = await db.update('credit_notes', id, updates);

      if (result.error) throw result.error;

      const selectResult = await db.selectOne('credit_notes', id);
      if (selectResult.error) throw selectResult.error;
      return selectResult.data as CreditNote;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['creditNotes'] });
      queryClient.invalidateQueries({ queryKey: ['creditNote', data.id] });
      queryClient.invalidateQueries({ queryKey: ['customerCreditNotes'] });
      toast.success(`Credit note ${data.credit_note_number} updated successfully!`);
    },
    onError: (error: any) => {
      console.error('Error updating credit note:', error);
      toast.error('Failed to update credit note. Please try again.');
    },
  });
}

// Delete a credit note
export function useDeleteCreditNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const db = getDatabase();

      // Check permission before deletion
      // Get user ID from localStorage (external API auth) or from Supabase
      let userId: string | null = localStorage.getItem('med_api_user_id');

      if (!userId) {
        // Get from current user (stored in localStorage)
        const user = getCurrentUser();
        userId = user.id;
      }

      if (!userId) throw new Error('Not authenticated');

      // Use database adapter to fetch profile (respects VITE_DATABASE_PROVIDER)
      const { data: profileData, error: profileError } = await db.selectOne('profiles', userId);

      if (profileError || !profileData) {
        console.warn('⚠️ Profile fetch error:', profileError?.message);
        throw new Error('Could not verify permissions for credit note deletion');
      }

      // Check if user has delete_credit_note permission
      if (profileData.permissions && !profileData.permissions.includes('delete_credit_note')) {
        throw new Error('You do not have permission to delete credit notes');
      }

      // Fallback to role-based check if permissions array not available
      if (!profileData.permissions && profileData.role !== 'admin') {
        throw new Error('You do not have permission to delete credit notes');
      }

      // 1. Fetch the complete credit note with all related data
      const creditNoteResult = await db.selectOne('credit_notes', id);
      if (creditNoteResult.error) throw creditNoteResult.error;
      const creditNote = creditNoteResult.data;

      if (!creditNote) throw new Error('Credit note not found');

      // 2. If credit note affects inventory, reverse stock movements
      let stockMovementsReversedCount = 0;
      if (creditNote.affects_inventory) {
        const stockMovementsResult = await db.selectBy('stock_movements', {
          reference_type: 'CREDIT_NOTE',
          reference_id: id
        });

        if (stockMovementsResult.error) {
          // Stock movements table may not exist, that's okay
          console.warn('Stock movements query failed:', stockMovementsResult.error);
        }

        if (stockMovementsResult.data && stockMovementsResult.data.length > 0) {
          const reversals = stockMovementsResult.data.map((movement: any) => ({
            company_id: movement.company_id,
            product_id: movement.product_id,
            movement_type: movement.movement_type === 'IN' ? 'OUT' : 'IN',
            reference_type: 'CREDIT_NOTE_REVERSAL',
            reference_id: id,
            quantity: movement.quantity,
            cost_per_unit: movement.cost_per_unit,
            notes: `Reversal of CREDIT_NOTE ${creditNote.credit_note_number}: ${movement.notes || ''}`,
          }));

          const reversalResult = await db.insertMany('stock_movements', reversals);
          if (reversalResult.error) {
            console.warn('Stock movements reversal failed:', reversalResult.error);
          }

          stockMovementsReversedCount = stockMovementsResult.data.length;
        }
      }

      // 3. If there are allocations, update related invoices
      const allocationsResult = await db.selectBy('credit_note_allocations', { credit_note_id: id });
      if (!allocationsResult.error && allocationsResult.data && allocationsResult.data.length > 0) {
        for (const allocation of allocationsResult.data) {
          const invoiceResult = await db.selectOne('invoices', allocation.invoice_id);

          if (!invoiceResult.error && invoiceResult.data) {
            const invoice = invoiceResult.data;
            // Recalculate balance_due by adding back the allocated amount
            const newBalanceDue = (invoice.balance_due || 0) + allocation.allocated_amount;

            await db.update('invoices', allocation.invoice_id, { balance_due: newBalanceDue });
          }
        }
      }

      // 4. Delete the credit note (cascade deletes items and allocations)
      const deleteResult = await db.delete('credit_notes', id);

      if (deleteResult.error) throw deleteResult.error;

      // 5. Log the deletion with full snapshot
      try {
        const currentUser = getCurrentUser();
        const userId = currentUser.id;
        const userEmail = currentUser.email;

        await db.insert('audit_logs', {
          action: 'DELETE',
          entity_type: 'credit_note',
          record_id: id,
          company_id: creditNote.company_id,
          actor_user_id: userId,
          actor_email: userEmail,
          details: {
            credit_note_number: creditNote.credit_note_number,
            customer_id: creditNote.customer_id,
            total_amount: creditNote.total_amount,
            applied_amount: creditNote.applied_amount,
            items_count: creditNote.credit_note_items?.length || 0,
            allocations_count: creditNote.credit_note_allocations?.length || 0,
            affected_invoices: creditNote.credit_note_allocations?.map((a) => a.invoice_id) || [],
            inventory_affected: creditNote.affects_inventory,
            stock_movements_reversed: stockMovementsReversedCount,
          },
        });
      } catch (auditError) {
        console.warn('Audit log creation failed:', auditError);
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditNotes'] });
      queryClient.invalidateQueries({ queryKey: ['customerCreditNotes'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Credit note deleted successfully! All related records have been updated.');
    },
    onError: (error: any) => {
      console.error('Error deleting credit note:', error);
      const errorMessage =
        error.message || 'Failed to delete credit note. Please try again.';
      toast.error(errorMessage);
    },
  });
}

// Generate credit note number
export function useGenerateCreditNoteNumber() {
  return useMutation({
    mutationFn: async (companyId: string) => {
      // Use the centralized document number generation API
      const { generateDocumentNumberAPI } = await import('@/utils/documentNumbering');
      return generateDocumentNumberAPI('credit_note');
    },
    onError: (error: any) => {
      console.error('Error generating credit note number:', error);
      toast.error('Failed to generate credit note number. Please try again.');
    },
  });
}

// Fetch credit note allocations
export function useCreditNoteAllocations(creditNoteId: string | undefined) {
  return useQuery({
    queryKey: ['creditNoteAllocations', creditNoteId],
    queryFn: async () => {
      if (!creditNoteId) throw new Error('Credit Note ID is required');

      const result = await db.selectBy('credit_note_allocations', { credit_note_id: creditNoteId });

      if (result.error) throw result.error;
      return (result.data || []) as (CreditNoteAllocation & {
        invoices: {
          invoice_number: string;
          total_amount: number;
          balance_due: number;
        };
      })[];
    },
    enabled: !!creditNoteId,
  });
}

// Apply credit note to invoice
export function useApplyCreditNoteToInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      creditNoteId,
      invoiceId,
      amount,
      appliedBy
    }: {
      creditNoteId: string;
      invoiceId: string;
      amount: number;
      appliedBy: string;
    }) => {
      const db = getDatabase();
      const { data, error } = await db.rpc('apply_credit_note_to_invoice', {
        credit_note_uuid: creditNoteId,
        invoice_uuid: invoiceId,
        amount_to_apply: amount,
        applied_by_uuid: appliedBy
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditNotes'] });
      queryClient.invalidateQueries({ queryKey: ['creditNoteAllocations'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Credit note applied to invoice successfully!');
    },
    onError: (error: any) => {
      console.error('Error applying credit note:', error);
      const errorMessage = error.message || 'Failed to apply credit note to invoice';
      toast.error(errorMessage);
    },
  });
}

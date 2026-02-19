import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getDatabase } from '@/integrations/database';
import { toast } from 'sonner';
import { getCurrentUser } from '@/utils/getCurrentUser';
import type { CreditNote, CreditNoteItem } from './useCreditNotes';

interface CreateCreditNoteWithItemsData {
  creditNote: Omit<CreditNote, 'id' | 'created_at' | 'updated_at' | 'customers' | 'credit_note_items' | 'invoices'>;
  items: Omit<CreditNoteItem, 'id' | 'credit_note_id' | 'created_at' | 'updated_at' | 'products'>[];
}

interface UpdateCreditNoteWithItemsData {
  creditNoteId: string;
  creditNote: Partial<CreditNote>;
  items: Omit<CreditNoteItem, 'id' | 'credit_note_id' | 'created_at' | 'updated_at' | 'products'>[];
}

// Create credit note with items (transactional)
export function useCreateCreditNoteWithItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ creditNote, items }: CreateCreditNoteWithItemsData) => {
      console.log('Creating credit note with items:', { creditNote, items });

      const db = getDatabase();

      // Start transaction-like operations
      try {
        // Ensure created_by defaults to the authenticated user
        let cleanCreditNote = { ...creditNote } as any;
        try {
          const currentUser = getCurrentUser();
          if (currentUser?.id) {
            cleanCreditNote.created_by = currentUser.id;
          } else if (typeof cleanCreditNote.created_by === 'undefined' || cleanCreditNote.created_by === null) {
            cleanCreditNote.created_by = null;
          }
        } catch {
          if (typeof cleanCreditNote.created_by === 'undefined') {
            cleanCreditNote.created_by = null;
          }
        }

        // 1. Create the credit note
        let createdCreditNote: any;
        let insertResult = await db.insert('credit_notes', cleanCreditNote);

        if (insertResult.error) {
          if (String(insertResult.error.message || '').includes('created_by')) {
            const retryPayload = { ...cleanCreditNote, created_by: null };
            insertResult = await db.insert('credit_notes', retryPayload);
            if (insertResult.error) {
              console.error('Error creating credit note:', insertResult.error);
              throw insertResult.error;
            }
          } else {
            console.error('Error creating credit note:', insertResult.error);
            throw insertResult.error;
          }
        }

        if (!insertResult.id) throw new Error('Failed to create credit note: no ID returned');
        const selectResult = await db.selectOne('credit_notes', insertResult.id);
        if (selectResult.error) throw selectResult.error;
        createdCreditNote = selectResult.data;

        console.log('Credit note created:', createdCreditNote);

        // 2. Create credit note items
        if (items.length > 0) {
          const itemsToInsert = items.map((item, index) => ({
            ...item,
            credit_note_id: createdCreditNote.id,
            sort_order: index
          }));

          const itemsResult = await db.insertMany('credit_note_items', itemsToInsert);

          if (itemsResult.error) {
            console.error('Error creating credit note items:', itemsResult.error);
            // Cleanup: delete the credit note if items failed
            await db.delete('credit_notes', createdCreditNote.id);
            throw itemsResult.error;
          }

          console.log('Credit note items created successfully');
        }

        // 3. Create stock movements if affects_inventory is true
        if (creditNote.affects_inventory && items.length > 0) {
          console.log('Creating stock movements for credit note...');

          const stockMovements = items
            .filter(item => item.product_id) // Only for items with products
            .map(item => ({
              company_id: creditNote.company_id,
              product_id: item.product_id!,
              movement_type: 'IN', // Credit notes typically return items to stock
              quantity: item.quantity,
              reference_type: 'CREDIT_NOTE',
              reference_id: createdCreditNote.id,
              notes: `Credit Note ${creditNote.credit_note_number} - ${item.description}`
            }));

          if (stockMovements.length > 0) {
            const stockResult = await db.insertMany('stock_movements', stockMovements);

            if (stockResult.error) {
              console.error('Error creating stock movements:', {
                error: stockResult.error,
                message: stockResult.error?.message
              });

              // Check if it's a missing table error
              if (String(stockResult.error?.message || '').includes('does not exist')) {
                toast.error('Stock movements table is missing. Please set up the stock_movements table in your database.');
              } else {
                toast.warning('Stock movements could not be created, but credit note was saved successfully.');
              }

              // Continue anyway - stock movements are not critical for credit note creation
              console.warn('Stock movements failed but credit note was created successfully');
            } else {
              console.log('Stock movements created successfully');

              // Update product stock quantities
              for (const movement of stockMovements) {
                try {
                  const rpcResult = await db.rpc('update_product_stock', {
                    product_uuid: movement.product_id,
                    movement_type: movement.movement_type,
                    quantity: Math.abs(movement.quantity)
                  });
                  if (rpcResult.error) {
                    throw rpcResult.error;
                  }
                } catch (stockUpdateError: any) {
                  console.error('Error updating product stock:', {
                    error: stockUpdateError,
                    message: stockUpdateError?.message,
                    product_id: movement.product_id
                  });
                  // Continue with other products
                }
              }
            }
          }
        }

        return createdCreditNote;
      } catch (error) {
        console.error('Error in credit note creation transaction:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['creditNotes'] });
      queryClient.invalidateQueries({ queryKey: ['customerCreditNotes'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Refresh products for stock updates
      queryClient.invalidateQueries({ queryKey: ['stockMovements'] });
      toast.success(`Credit note ${data.credit_note_number} created successfully!`);
    },
    onError: (error: any) => {
      console.error('Error creating credit note with items:', error);
      let errorMessage = 'Failed to create credit note';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.details) {
        errorMessage = error.details;
      }
      
      toast.error(errorMessage);
    },
  });
}

// Update credit note with items (transactional)
export function useUpdateCreditNoteWithItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ creditNoteId, creditNote, items }: UpdateCreditNoteWithItemsData) => {
      console.log('Updating credit note with items:', { creditNoteId, creditNote, items });

      const db = getDatabase();

      try {
        // 1. Get existing credit note to check if it affects inventory
        const existingResult = await db.selectOne('credit_notes', creditNoteId);
        if (existingResult.error) throw existingResult.error;
        const existingCreditNote = existingResult.data;

        // 2. If the credit note affects inventory, reverse existing stock movements
        if (existingCreditNote.affects_inventory) {
          console.log('Reversing existing stock movements...');

          const movementsResult = await db.selectBy('stock_movements', {
            reference_type: 'CREDIT_NOTE',
            reference_id: creditNoteId
          });

          if (movementsResult.error) {
            console.error('Error fetching existing movements:', movementsResult.error);
          } else if (movementsResult.data && movementsResult.data.length > 0) {
            // Reverse the movements by creating opposite movements
            const reverseMovements = movementsResult.data.map((movement: any) => ({
              company_id: movement.company_id,
              product_id: movement.product_id,
              movement_type: movement.movement_type === 'IN' ? 'OUT' : 'IN',
              quantity: movement.quantity,
              reference_type: 'CREDIT_NOTE_REVERSAL',
              reference_id: creditNoteId,
              notes: `Reversal of ${movement.notes}`
            }));

            const reverseResult = await db.insertMany('stock_movements', reverseMovements);

            if (reverseResult.error) {
              console.error('Error creating reverse movements:', reverseResult.error);
            } else {
              // Update product stock for reversals
              for (const movement of reverseMovements) {
                try {
                  const rpcResult = await db.rpc('update_product_stock', {
                    product_uuid: movement.product_id,
                    movement_type: movement.movement_type,
                    quantity: Math.abs(movement.quantity)
                  });
                  if (rpcResult.error) {
                    throw rpcResult.error;
                  }
                } catch (stockUpdateError) {
                  console.error('Error updating product stock (reversal):', stockUpdateError);
                }
              }
            }
          }
        }

        // 3. Update the credit note
        const updateResult = await db.update('credit_notes', creditNoteId, creditNote);
        if (updateResult.error) throw updateResult.error;

        const updatedSelectResult = await db.selectOne('credit_notes', creditNoteId);
        if (updatedSelectResult.error) throw updatedSelectResult.error;
        const updatedCreditNote = updatedSelectResult.data;

        // 4. Delete existing credit note items
        const deleteItemsResult = await db.deleteMany('credit_note_items', { credit_note_id: creditNoteId });
        if (deleteItemsResult.error) throw deleteItemsResult.error;

        // 5. Insert new credit note items
        if (items.length > 0) {
          const itemsToInsert = items.map((item, index) => ({
            ...item,
            credit_note_id: creditNoteId,
            sort_order: index
          }));

          const itemsResult = await db.insertMany('credit_note_items', itemsToInsert);
          if (itemsResult.error) throw itemsResult.error;
        }

        // 6. Create new stock movements if affects_inventory is true
        const newAffectsInventory = creditNote.affects_inventory ?? existingCreditNote.affects_inventory;
        if (newAffectsInventory && items.length > 0) {
          console.log('Creating new stock movements...');

          const stockMovements = items
            .filter(item => item.product_id)
            .map(item => ({
              company_id: updatedCreditNote.company_id,
              product_id: item.product_id!,
              movement_type: 'IN' as const,
              quantity: item.quantity,
              reference_type: 'CREDIT_NOTE',
              reference_id: creditNoteId,
              notes: `Credit Note ${updatedCreditNote.credit_note_number} (Updated) - ${item.description}`
            }));

          if (stockMovements.length > 0) {
            const stockResult = await db.insertMany('stock_movements', stockMovements);

            if (stockResult.error) {
              console.error('Error creating new stock movements:', stockResult.error);
            } else {
              // Update product stock quantities
              for (const movement of stockMovements) {
                try {
                  const rpcResult = await db.rpc('update_product_stock', {
                    product_uuid: movement.product_id,
                    movement_type: movement.movement_type,
                    quantity: Math.abs(movement.quantity)
                  });
                  if (rpcResult.error) {
                    throw rpcResult.error;
                  }
                } catch (stockUpdateError) {
                  console.error('Error updating product stock (new):', stockUpdateError);
                }
              }
            }
          }
        }

        return updatedCreditNote;
      } catch (error) {
        console.error('Error in credit note update transaction:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['creditNotes'] });
      queryClient.invalidateQueries({ queryKey: ['creditNote', data.id] });
      queryClient.invalidateQueries({ queryKey: ['customerCreditNotes'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stockMovements'] });
      toast.success(`Credit note ${data.credit_note_number} updated successfully!`);
    },
    onError: (error: any) => {
      console.error('Error updating credit note with items:', error);
      let errorMessage = 'Failed to update credit note';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.details) {
        errorMessage = error.details;
      }
      
      toast.error(errorMessage);
    },
  });
}

// Convert invoice to credit note
export function useConvertInvoiceToCreditNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      reason,
      affectsInventory = false,
      itemsToCredit
    }: {
      invoiceId: string;
      reason?: string;
      affectsInventory?: boolean;
      itemsToCredit?: { itemId: string; quantity: number }[]; // Partial credit note
    }) => {
      console.log('Converting invoice to credit note:', { invoiceId, reason, affectsInventory, itemsToCredit });

      const db = getDatabase();

      // 1. Fetch the invoice with items
      const invoiceResult = await db.selectOne('invoices', invoiceId);
      if (invoiceResult.error) throw invoiceResult.error;
      const invoice = invoiceResult.data;

      // 2. Generate credit note number
      const { data: creditNoteNumber, error: numberError } = await db.rpc<string>('generate_credit_note_number', { company_uuid: invoice.company_id });

      if (numberError) throw numberError;

      // 3. Determine which items to credit
      let itemsToProcess = invoice.invoice_items;
      if (itemsToCredit && itemsToCredit.length > 0) {
        itemsToProcess = invoice.invoice_items
          .filter(item => itemsToCredit.some(credit => credit.itemId === item.id))
          .map(item => {
            const creditInfo = itemsToCredit.find(credit => credit.itemId === item.id);
            return {
              ...item,
              quantity: creditInfo ? creditInfo.quantity : item.quantity
            };
          });
      }

      // 4. Calculate totals
      const subtotal = itemsToProcess.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const taxAmount = itemsToProcess.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
      const totalAmount = itemsToProcess.reduce((sum, item) => sum + item.line_total, 0);

      // 5. Create the credit note
      // Determine creator (prefer invoice.created_by, fall back to current user)
      let createdBy: string | null = invoice.created_by || null;
      if (!createdBy) {
        try {
          const currentUser = getCurrentUser();
          createdBy = currentUser?.id || null;
        } catch {
          createdBy = null;
        }
      }

      const creditNoteData = {
        company_id: invoice.company_id,
        customer_id: invoice.customer_id,
        invoice_id: invoice.id,
        credit_note_number: creditNoteNumber,
        credit_note_date: new Date().toISOString().split('T')[0],
        status: 'draft' as const,
        reason: reason || 'Invoice conversion',
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        applied_amount: 0,
        balance: totalAmount,
        affects_inventory: affectsInventory,
        notes: `Created from Invoice ${invoice.invoice_number}`,
        terms_and_conditions: invoice.terms_and_conditions,
        created_by: createdBy
      };

      const creditNoteItems = itemsToProcess.map(item => ({
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_percentage: item.tax_percentage || 0,
        tax_amount: item.tax_amount || 0,
        tax_inclusive: item.tax_inclusive || false,
        tax_setting_id: item.tax_setting_id,
        line_total: item.line_total,
        sort_order: 0
      }));

      // Use the create with items hook
      return { creditNote: creditNoteData, items: creditNoteItems };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditNotes'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice converted to credit note successfully!');
    },
    onError: (error: any) => {
      console.error('Error converting invoice to credit note:', error);
      toast.error('Failed to convert invoice to credit note');
    },
  });
}

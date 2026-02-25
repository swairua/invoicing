import { supabase } from '@/integrations/supabase/client';

import { getDatabase } from '@/integrations/database';

export interface ReconciliationResult {
  invoiceId: string;
  invoiceNumber: string;
  totalAmount: number;
  calculatedTotalAmount: number;
  calculatedPaidAmount: number;
  storedPaidAmount: number;
  calculatedBalance: number;
  storedBalance: number;
  discrepancy: number;
  status: 'matched' | 'mismatched';
  expectedStatus: string;
  actualStatus: string;
  fixed: boolean;
  error?: string;
}

/**
 * Reconcile invoice balance with payment allocations and line items
 * Detects and optionally fixes discrepancies
 */
export async function reconcileInvoiceBalance(
  invoiceId: string,
  fix: boolean = false
): Promise<ReconciliationResult> {
  try {
    const db = getDatabase();

    // 1. Get invoice
    const invoiceResult = await db.selectOne('invoices', invoiceId);
    if (invoiceResult.error) throw invoiceResult.error;
    const invoice = invoiceResult.data;
    if (!invoice) throw new Error('Invoice not found');

    // 2. Get all items and allocations for this invoice
    const itemsResult = await db.selectBy('invoice_items', { invoice_id: invoiceId });
    if (itemsResult.error) throw itemsResult.error;
    const items = itemsResult.data || [];

    const allocationsResult = await db.selectBy('payment_allocations', { invoice_id: invoiceId });
    if (allocationsResult.error) throw allocationsResult.error;
    const allocations = allocationsResult.data || [];

    // 3. Calculate values
    const storedTotalAmount = Number(invoice.total_amount || 0);
    const storedPaidAmount = Number(invoice.paid_amount || 0);
    const storedBalance = Number(invoice.balance_due || 0);

    // Calculate total from items
    const calculatedTotalAmount = (items || []).reduce(
      (sum, item) => sum + Number(item.line_total || 0),
      0
    );

    // Use calculated total if items exist, otherwise fall back to stored total
    const effectiveTotalAmount = items.length > 0 ? calculatedTotalAmount : storedTotalAmount;

    const calculatedPaidAmount = (allocations || []).reduce(
      (sum, alloc) => sum + Number(alloc.amount_allocated || 0),
      0
    );
    const calculatedBalance = effectiveTotalAmount - calculatedPaidAmount;

    // 4. Determine expected status (using tolerance for floating-point precision)
    let expectedStatus = 'draft';
    const tolerance = 0.01;
    const adjustedBalance = Math.abs(calculatedBalance) < tolerance ? 0 : calculatedBalance;
    if (adjustedBalance <= 0 && calculatedPaidAmount > 0) {
      expectedStatus = 'paid';
    } else if (calculatedPaidAmount > 0) {
      expectedStatus = 'partial';
    }

    // 5. Check for discrepancies
    const totalDiscrepancy = Math.abs(storedTotalAmount - calculatedTotalAmount);
    const paidAmountDiscrepancy = Math.abs(storedPaidAmount - calculatedPaidAmount);
    const balanceDiscrepancy = Math.abs(storedBalance - calculatedBalance);
    const statusMismatch = invoice.status !== expectedStatus;

    // We only consider it a discrepancy if items exist and their sum doesn't match total_amount,
    // or if the balance/paid amounts are wrong.
    const hasTotalDiscrepancy = items.length > 0 && totalDiscrepancy > 0.01;
    const hasDiscrepancy = hasTotalDiscrepancy || paidAmountDiscrepancy > 0.01 || balanceDiscrepancy > 0.01 || statusMismatch;

    const result: ReconciliationResult = {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      totalAmount: storedTotalAmount,
      calculatedTotalAmount,
      calculatedPaidAmount,
      storedPaidAmount: storedPaidAmount,
      calculatedBalance,
      storedBalance: storedBalance,
      discrepancy: Math.max(totalDiscrepancy, paidAmountDiscrepancy, balanceDiscrepancy),
      status: hasDiscrepancy ? 'mismatched' : 'matched',
      expectedStatus,
      actualStatus: invoice.status,
      fixed: false
    };

    // 6. Fix if requested and needed
    if (fix && hasDiscrepancy) {
      const updateResult = await db.update('invoices', invoiceId, {
        total_amount: effectiveTotalAmount,
        paid_amount: calculatedPaidAmount,
        balance_due: calculatedBalance,
        status: expectedStatus,
        updated_at: new Date().toISOString()
      });

      if (updateResult.error) {
        result.error = updateResult.error.message || 'Update failed';
        result.fixed = false;
      } else {
        result.fixed = true;
      }
    }

    return result;
  } catch (error: any) {
    throw new Error(`Failed to reconcile invoice ${invoiceId}: ${error.message}`);
  }
}

/**
 * Reconcile all invoices in a company
 * Returns summary of reconciliation results
 */
export async function reconcileAllInvoiceBalances(
  companyId: string,
  fix: boolean = false
): Promise<{
  total: number;
  matched: number;
  mismatched: number;
  fixed: number;
  results: ReconciliationResult[];
  errors: string[];
}> {
  try {
    // 1. Get all invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (invoicesError) throw invoicesError;

    const results: ReconciliationResult[] = [];
    const errors: string[] = [];

    // 2. Reconcile each invoice
    for (const invoice of invoices || []) {
      try {
        const result = await reconcileInvoiceBalance(invoice.id, fix);
        results.push(result);
      } catch (error: any) {
        errors.push(`Invoice ${invoice.id}: ${error.message}`);
      }
    }

    // 3. Summary
    const summary = {
      total: results.length,
      matched: results.filter(r => r.status === 'matched').length,
      mismatched: results.filter(r => r.status === 'mismatched').length,
      fixed: results.filter(r => r.fixed).length,
      results,
      errors
    };

    return summary;
  } catch (error: any) {
    throw new Error(`Failed to reconcile invoices: ${error.message}`);
  }
}

/**
 * Audit trail: Get payment history for an invoice
 */
export async function getPaymentAuditTrail(invoiceId: string): Promise<any[]> {
  try {
    // Get allocations with payment details
    const { data, error } = await supabase
      .from('payment_allocations')
      .select(`
        id,
        amount_allocated,
        created_at,
        payments (
          id,
          payment_number,
          amount,
          payment_method,
          payment_date,
          reference_number,
          created_by,
          created_at,
          profiles:created_by (
            email,
            full_name
          )
        )
      `)
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(allocation => ({
      id: allocation.id,
      paymentNumber: allocation.payments?.payment_number,
      paymentAmount: allocation.payments?.amount,
      allocatedAmount: allocation.amount_allocated,
      paymentMethod: allocation.payments?.payment_method,
      paymentDate: allocation.payments?.payment_date,
      referenceNumber: allocation.payments?.reference_number,
      createdBy: allocation.payments?.profiles?.full_name || allocation.payments?.profiles?.email,
      createdAt: allocation.created_at
    }));
  } catch (error: any) {
    console.error('Failed to get payment audit trail:', error);
    return [];
  }
}

/**
 * Check if an invoice has payment discrepancies
 */
export async function hasBalanceDiscrepancy(invoiceId: string): Promise<boolean> {
  try {
    const result = await reconcileInvoiceBalance(invoiceId, false);
    return result.status === 'mismatched';
  } catch (error) {
    console.error('Failed to check balance discrepancy:', error);
    return false;
  }
}

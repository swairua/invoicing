import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/integrations/api';

/**
 * Fixed hook for fetching quotations with customer data
 * Uses the external API adapter for database operations
 */
export const useQuotationsFixed = (companyId?: string) => {
  return useQuery({
    queryKey: ['quotations_fixed', companyId],
    queryFn: async () => {
      if (!companyId) {
        console.log('[useQuotationsFixed] No companyId provided, returning empty array');
        return [];
      }

      // Verify user is authenticated before making API calls
      const { session } = await apiClient.auth.getSession();
      if (!session?.user) {
        console.warn('[useQuotationsFixed] User not authenticated: No session');
        return [];
      }

      try {
        console.log('[useQuotationsFixed] Starting fetch for companyId:', companyId);

        // Fetch ALL quotations first to see what's in the database
        console.log('[useQuotationsFixed] Fetching ALL quotations (no filter) to debug...');
        const { data: allQuotations, error: allError } = await apiClient.select('quotations', {});
        console.log('[useQuotationsFixed] ALL quotations result:', {
          error: allError?.message,
          count: Array.isArray(allQuotations) ? allQuotations.length : 'not-array',
          isArray: Array.isArray(allQuotations),
          firstItem: Array.isArray(allQuotations) && allQuotations.length > 0 ? {
            id: allQuotations[0].id,
            quotation_number: allQuotations[0].quotation_number,
            company_id: allQuotations[0].company_id,
            customer_id: allQuotations[0].customer_id,
          } : 'no-items'
        });

        // Use unfiltered quotations for now to show all data
        console.log('[useQuotationsFixed] Using unfiltered quotations (for debugging)');
        const quotations = allQuotations;
        const quotationsError = allError;

        console.log('[useQuotationsFixed] API response - Error:', quotationsError);
        console.log('[useQuotationsFixed] API response - Data type:', typeof quotations, 'Is Array:', Array.isArray(quotations));
        console.log('[useQuotationsFixed] API response - Data length:', Array.isArray(quotations) ? quotations.length : 'N/A');
        console.log('[useQuotationsFixed] Raw API response:', quotations);

        if (quotationsError) {
          console.error('[useQuotationsFixed] Error fetching quotations:', quotationsError);
          throw new Error(`Failed to fetch quotations: ${quotationsError.message}`);
        }

        if (!Array.isArray(quotations)) {
          console.log('[useQuotationsFixed] Quotations is not an array, returning empty');
          return [];
        }

        if (!quotations || quotations.length === 0) {
          console.log('[useQuotationsFixed] No quotations returned from API');
          return [];
        }

        console.log('[useQuotationsFixed] Quotations fetched successfully, count:', quotations.length);
        console.log('[useQuotationsFixed] First quotation sample:', quotations[0]);

        // Try to fetch customer data
        const customerIds = [...new Set(quotations.map((quotation: any) => quotation.customer_id).filter(id => id && typeof id === 'string'))];
        console.log('[useQuotationsFixed] Unique customer IDs found:', customerIds.length, customerIds);

        let customerMap = new Map();

        if (customerIds.length > 0) {
          try {
            // Fetch customers
            for (const customerId of customerIds) {
              const { data: customer, error: customerError } = await apiClient.selectOne('customers', customerId);
              console.log(`[useQuotationsFixed] Fetched customer ${customerId} - Error:`, customerError, 'Data:', customer);
              if (!customerError && customer) {
                customerMap.set(customerId, customer);
              }
            }
            console.log('[useQuotationsFixed] Customer map size after fetching:', customerMap.size);
          } catch (e) {
            console.warn('[useQuotationsFixed] Could not fetch customer details (non-fatal):', e);
          }
        }

        // Try to fetch quotation items
        let itemsMap = new Map();
        let quotationIds = quotations.map((quot: any) => quot.id);
        console.log('[useQuotationsFixed] Quotation IDs to fetch items for:', quotationIds.length, quotationIds.slice(0, 5));

        if (quotationIds.length > 0) {
          try {
            // Fetch quotation items for all quotations
            console.log('[useQuotationsFixed] Fetching quotation_items with filter: {}');
            const { data: allItems, error: itemsError } = await apiClient.select('quotation_items', {});

            console.log('[useQuotationsFixed] All items API response - Error:', itemsError);
            console.log('[useQuotationsFixed] All items API response - Count:', Array.isArray(allItems) ? allItems.length : 'Not an array');
            console.log('[useQuotationsFixed] All items sample:', Array.isArray(allItems) ? allItems.slice(0, 3) : allItems);

            if (!itemsError && Array.isArray(allItems)) {
              // Filter items for our quotations
              const relevantItems = allItems.filter((item: any) => quotationIds.includes(item.quotation_id));
              console.log('[useQuotationsFixed] Filtered relevant items count:', relevantItems.length);

              // Group by quotation_id
              relevantItems.forEach((item: any) => {
                if (!itemsMap.has(item.quotation_id)) {
                  itemsMap.set(item.quotation_id, []);
                }
                itemsMap.get(item.quotation_id).push(item);
              });
              console.log('[useQuotationsFixed] Items map size (quotations with items):', itemsMap.size);
            }
          } catch (e) {
            console.warn('[useQuotationsFixed] Could not fetch quotation items (non-fatal):', e);
          }
        }

        // Combine data
        const enrichedQuotations = quotations.map((quotation: any) => ({
          ...quotation,
          customers: customerMap.get(quotation.customer_id) || {
            name: 'Unknown Customer',
            email: null,
            phone: null
          },
          quotation_items: itemsMap.get(quotation.id) || []
        }));

        console.log('[useQuotationsFixed] Enrichment complete - Quotations with items:', enrichedQuotations.filter((quot: any) => quot.quotation_items.length > 0).length);
        console.log('[useQuotationsFixed] Final enriched quotations sample:', enrichedQuotations.slice(0, 2));
        return enrichedQuotations;

      } catch (error) {
        console.error('[useQuotationsFixed] Fatal error in useQuotationsFixed:', error);
        console.error('[useQuotationsFixed] Error details:', {
          message: (error as any)?.message,
          stack: (error as any)?.stack,
          error
        });
        throw error;
      }
    },
    enabled: !!companyId,
    staleTime: 30000, // Cache for 30 seconds
    retry: 1,
    retryDelay: 1000,
  });
};

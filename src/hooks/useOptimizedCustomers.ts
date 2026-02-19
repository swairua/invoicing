import { useQuery } from '@tanstack/react-query';
import { getDatabase } from '@/integrations/database';
import { useMemo } from 'react';

export interface OptimizedCustomer {
  id: string;
  company_id: string;
  customer_code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  credit_limit?: number;
  payment_terms?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface UseOptimizedCustomersOptions {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  statusFilter?: 'all' | 'active' | 'inactive';
  cityFilter?: string;
  creditLimitFilter?: 'all' | 'with_limit' | 'no_limit';
}

export const useOptimizedCustomers = (
  companyId?: string, 
  options: UseOptimizedCustomersOptions = {}
) => {
  const { 
    page = 1, 
    pageSize = 20, 
    searchTerm = '', 
    statusFilter = 'all',
    cityFilter = 'all',
    creditLimitFilter = 'all'
  } = options;

  return useQuery({
    queryKey: ['customers-optimized', companyId, page, pageSize, searchTerm, statusFilter, cityFilter, creditLimitFilter],
    queryFn: async () => {
      console.log('🔍 Loading customers with optimization...');
      const startTime = performance.now();

      const db = getDatabase();
      const filter: Record<string, any> = {};

      // Apply company filter
      if (companyId) {
        filter.company_id = companyId;
      }

      // Apply status filter
      if (statusFilter === 'active') {
        filter.is_active = true;
      } else if (statusFilter === 'inactive') {
        filter.is_active = false;
      }

      // Apply city filter
      if (cityFilter && cityFilter !== 'all') {
        filter.city = cityFilter;
      }

      // Fetch all matching records
      const result = await db.selectBy('customers', filter);

      if (result.error) {
        console.error('❌ Customers query failed:', result.error);
        throw result.error;
      }

      let customers = result.data || [];

      // Apply search filter (client-side)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        customers = customers.filter((customer: any) =>
          (customer.name && customer.name.toLowerCase().includes(searchLower)) ||
          (customer.customer_code && customer.customer_code.toLowerCase().includes(searchLower)) ||
          (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
          (customer.phone && customer.phone.toLowerCase().includes(searchLower))
        );
      }

      // Apply credit limit filter (client-side)
      if (creditLimitFilter === 'with_limit') {
        customers = customers.filter((c: any) => c.credit_limit !== null && c.credit_limit !== undefined);
      } else if (creditLimitFilter === 'no_limit') {
        customers = customers.filter((c: any) => !c.credit_limit);
      }

      // Sort by created_at descending
      customers = customers.sort((a: any, b: any) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });

      // Apply pagination
      const totalCount = customers.length;
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedCustomers = customers.slice(from, to);

      const endTime = performance.now();
      console.log(`✅ Customers loaded in ${(endTime - startTime).toFixed(2)}ms`);

      return {
        customers: paginatedCustomers,
        totalCount,
        hasMore: to < totalCount,
        currentPage: page
      };
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
    retry: 2
  });
};

// Hook for customer statistics (separate query for better caching)
export const useCustomerStats = (companyId?: string) => {
  return useQuery({
    queryKey: ['customer-stats', companyId],
    queryFn: async () => {
      console.log('📊 Loading customer statistics...');

      const db = getDatabase();
      const filter: Record<string, any> = {};

      if (companyId) {
        filter.company_id = companyId;
      }

      const result = await db.selectBy('customers', filter);

      if (result.error) throw result.error;

      const stats = (result.data || []).reduce((acc, customer: any) => {
        acc.totalCustomers++;

        if (customer.is_active !== false) {
          acc.activeCustomers++;
        } else {
          acc.inactiveCustomers++;
        }

        if (customer.credit_limit) {
          acc.customersWithCreditLimit++;
          acc.totalCreditLimit += customer.credit_limit;
        }

        // Track unique cities
        if (customer.city && !acc.cities.includes(customer.city)) {
          acc.cities.push(customer.city);
        }

        return acc;
      }, {
        totalCustomers: 0,
        activeCustomers: 0,
        inactiveCustomers: 0,
        customersWithCreditLimit: 0,
        totalCreditLimit: 0,
        cities: [] as string[]
      });

      return stats;
    },
    staleTime: 60000, // Cache stats for 1 minute
    refetchOnWindowFocus: false
  });
};

// Hook for customer cities (for filter dropdown)
export const useCustomerCities = (companyId?: string) => {
  return useQuery({
    queryKey: ['customer-cities', companyId],
    queryFn: async () => {
      const db = getDatabase();
      const filter: Record<string, any> = {};

      if (companyId) {
        filter.company_id = companyId;
      }

      const result = await db.selectBy('customers', filter);

      if (result.error) throw result.error;

      // Get unique cities, filter out nulls and sort
      const cities = Array.from(new Set((result.data || []).map((c: any) => c.city).filter(Boolean))) as string[];
      cities.sort();
      return cities;
    },
    staleTime: 300000, // Cache cities for 5 minutes
    refetchOnWindowFocus: false
  });
};

// Memoized currency formatter
export const useCurrencyFormatter = () => {
  return useMemo(() => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }, []);
};

// Helper for customer status
export const getCustomerStatusColor = (isActive: boolean) => {
  return isActive 
    ? 'bg-success-light text-success border-success/20'
    : 'bg-muted text-muted-foreground border-muted-foreground/20';
};

// Helper for customer initials
export const getCustomerInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

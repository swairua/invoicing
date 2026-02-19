import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useCompanies } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logUnauthorizedCompanyAccess } from '@/utils/companyAccessLogger';

interface CompanyContextType {
  companies: any[];
  currentCompany: any | null;
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  switchCompany: (id: string) => void;
  isLoading: boolean;
  error: Error | null;
  isReady: boolean;
}

export const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const SELECTED_COMPANY_STORAGE_KEY = 'selected-company-id';

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { profile, isAdmin } = useAuth();
  
  // For non-admin users, filter companies by their assigned company_id
  // For admin users, fetch all companies (pass undefined to skip filtering)
  const companyIdFilter = !isAdmin && profile?.company_id ? profile.company_id : undefined;
  const { data: companies, isLoading, error } = useCompanies(companyIdFilter);
  
  const [isReady, setIsReady] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string | null>(null);

  // Load selected company from localStorage on mount
  useEffect(() => {
    const storedCompanyId = localStorage.getItem(SELECTED_COMPANY_STORAGE_KEY);
    setSelectedCompanyIdState(storedCompanyId);
  }, []);

  // When companies load, set selected company if not already set
  useEffect(() => {
    if (!isLoading && companies && companies.length > 0 && !selectedCompanyId) {
      const storedCompanyId = localStorage.getItem(SELECTED_COMPANY_STORAGE_KEY);
      
      // Priority: stored company ID > user's assigned company ID > first company in list
      let companyIdToUse: string | null = null;
      
      if (storedCompanyId) {
        // Check if stored company is in the available list (for non-admin users)
        const isStoreCompanyAvailable = companies.some(c => c.id === storedCompanyId);
        if (isStoreCompanyAvailable) {
          companyIdToUse = storedCompanyId;
        } else if (!isAdmin) {
          // Non-admin trying to access a company they don't have access to
          console.warn(`Non-admin user tried to access unavailable company: ${storedCompanyId}`);
          // Fall through to use user's assigned company
        } else {
          // Admin can access any company (stored company should always be available)
          companyIdToUse = storedCompanyId;
        }
      }
      
      // If stored company is not available or not set, use user's assigned company
      if (!companyIdToUse && profile?.company_id) {
        const userCompanyInList = companies.find(c => c.id === profile.company_id);
        if (userCompanyInList) {
          companyIdToUse = profile.company_id;
        }
      }
      
      // Fall back to first company if none of the above worked
      if (!companyIdToUse && companies.length > 0) {
        companyIdToUse = companies[0]?.id;
      }

      if (companyIdToUse) {
        setSelectedCompanyIdState(companyIdToUse);
        localStorage.setItem(SELECTED_COMPANY_STORAGE_KEY, companyIdToUse);
      }
    }
  }, [isLoading, companies, selectedCompanyId, profile?.company_id, isAdmin]);

  // Determine current company based on selectedCompanyId or first company
  const currentCompany = selectedCompanyId
    ? companies?.find(c => c.id === selectedCompanyId) || companies?.[0] || null
    : companies?.[0] || null;

  // Wrapper function to update selected company ID with authorization check
  const setSelectedCompanyId = (id: string | null) => {
    // If user is non-admin and trying to select a company not in their available list, deny access
    if (id && !isAdmin) {
      const selectedCompanyExists = companies.find(c => c.id === id);
      if (!selectedCompanyExists) {
        // Log unauthorized access attempt
        console.warn(`Unauthorized company access attempt: User ${profile?.email} tried to access company ${id}`);
        
        // Log to audit trail (optional - for now just toast)
        logUnauthorizedCompanyAccess(
          profile?.id || 'unknown',
          profile?.email || 'unknown',
          profile?.company_id || 'unknown',
          id
        ).catch(err => {
          console.error('Failed to log unauthorized access:', err);
        });
        
        toast.warning('You do not have access to that company');
        return;
      }
    }
    
    // Proceed with normal selection
    setSelectedCompanyIdState(id);
    if (id) {
      localStorage.setItem(SELECTED_COMPANY_STORAGE_KEY, id);
    } else {
      localStorage.removeItem(SELECTED_COMPANY_STORAGE_KEY);
    }
  };

  // Helper function to switch companies
  const switchCompany = (id: string) => {
    setSelectedCompanyId(id);
  };

  // Set isReady when loading is complete and we have company data or error
  useEffect(() => {
    if (!isLoading) {
      setIsReady(true);

      // Log warnings if company is not found
      if (!currentCompany && !error) {
        console.warn('No companies found for the current user');
      }

      if (error) {
        console.error('Error loading company:', error);
      }
    }
  }, [isLoading, currentCompany, error]);

  // After 5 seconds, assume loading has timed out and mark as ready
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        setLoadTimeout(true);
        setIsReady(true);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  return (
    <CompanyContext.Provider value={{
      companies: companies || [],
      currentCompany,
      selectedCompanyId,
      setSelectedCompanyId,
      switchCompany,
      isLoading: isLoading && !loadTimeout,
      error,
      isReady
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCurrentCompany() {
  const context = useContext(CompanyContext);
  // Return safe default when used outside of provider (e.g., on login page)
  if (context === undefined) {
    return {
      companies: [],
      currentCompany: null,
      selectedCompanyId: null,
      setSelectedCompanyId: () => {},
      switchCompany: () => {},
      isLoading: false,
      error: null,
      isReady: true
    };
  }
  return context;
}

export function useCurrentCompanyId() {
  const { currentCompany } = useCurrentCompany();
  return currentCompany?.id || null;
}

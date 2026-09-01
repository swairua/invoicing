import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { getDatabase } from '@/integrations/database';
import { logError } from '@/utils/errorLogger';
import { updateFavicon } from '@/utils/seoHelpers';
import type { CompanyRecord } from '@/types/company';

/**
 * Company configuration interface for public-facing branding and SEO
 */
export type CompanyConfig = CompanyRecord;

interface CompanyConfigContextType {
  config: CompanyConfig | null;
  isLoading: boolean;
  error: Error | null;
  isReady: boolean;
}

const defaultConfig: CompanyConfig = {
  id: 'default',
  name: 'Your Company',
  logo_url: '/fallback-logo.svg',
};

const CompanyConfigContext = createContext<CompanyConfigContextType | undefined>(undefined);

export function CompanyConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<CompanyConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Load first company from database on mount
  const loadCompanyConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const database = getDatabase();
      if (!database) {
        throw new Error('Database not initialized');
      }

      const result = await database.select<CompanyRecord>('companies', { is_active: true });

      if (result.error) {
        console.warn('⚠️  Error fetching company config from database:', result.error);
        // Use fallback defaults
        setConfig(defaultConfig);
        updateFavicon(defaultConfig.logo_url, defaultConfig);
      } else if (result.data && result.data.length > 0) {
        const companyData = result.data[0];
        const loadedConfig: CompanyConfig = {
          ...companyData,
          id: companyData.id,
          name: companyData.name || defaultConfig.name,
          logo_url: companyData.logo_url || defaultConfig.logo_url,
        };
        console.log('✅ Company config loaded from database:', loadedConfig.name);
        setConfig(loadedConfig);
        // Update favicon to match company logo
        updateFavicon(loadedConfig.logo_url, loadedConfig);
      } else {
        // No companies found, use defaults
        console.warn('ℹ️  No companies found in database, using defaults');
        setConfig(defaultConfig);
        updateFavicon(defaultConfig.logo_url, defaultConfig);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('❌ Error loading company config:', error);
      logError('CompanyConfigContext: Error loading company config', error, {
        context: 'loadCompanyConfig'
      });
      // Use fallback defaults on error
      setConfig(defaultConfig);
      updateFavicon(defaultConfig.logo_url, defaultConfig);
      setError(error);
    } finally {
      setIsLoading(false);
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    loadCompanyConfig();

    const handleRefresh = (event: Event) => {
      const detail = (event as CustomEvent<{ table?: string }>).detail;
      if (!detail?.table || detail.table === 'companies') {
        loadCompanyConfig();
      }
    };

    window.addEventListener('database:refresh', handleRefresh);
    return () => window.removeEventListener('database:refresh', handleRefresh);
  }, [loadCompanyConfig]);

  return (
    <CompanyConfigContext.Provider value={{ config, isLoading, error, isReady }}>
      {children}
    </CompanyConfigContext.Provider>
  );
}

/**
 * Hook to use company configuration throughout the app
 * Returns the active public company config, or neutral defaults while unavailable.
 */
export function useCompanyConfig(): CompanyConfig {
  const context = useContext(CompanyConfigContext);

  // Allow use outside of provider (e.g., on login page) with defaults
  if (context === undefined) {
    return defaultConfig;
  }

  // Return loaded config or defaults while loading
  return context.config || defaultConfig;
}

/**
 * Hook to check if company config is ready
 * Useful for components that need to wait for config before rendering
 */
export function useCompanyConfigReady(): boolean {
  const context = useContext(CompanyConfigContext);

  if (context === undefined) {
    return true; // Consider ready if provider not available
  }

  return context.isReady;
}

export default CompanyConfigProvider;

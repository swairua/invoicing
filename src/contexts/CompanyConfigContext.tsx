import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { getDatabase } from '@/integrations/database';
import { getClientApiUrl } from '@/utils/getApiUrl';
import { logError } from '@/utils/errorLogger';
import { updateFavicon } from '@/utils/seoHelpers';
import { setActiveCompanyConfig } from '@/utils/activeCompanyConfig';
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
  name: 'Diag Solutions Ltd',
  email: 'sales@heal.co.ke',
  phone: '+254 207 863 782',
  address: 'Naivasha Road, Kamrose Plaza, 1st Flr, Rm 14',
  city: 'Nairobi',
  country: 'Kenya',
  currency: 'KES',
  logo_url: '/fallback-logo.svg',
  primary_color: '#0d9488',
  description: 'Haemonetics East Africa Limited supplies laboratory reagents, instrumentation and diagnostic equipment to hospitals, universities, research and industrial clients across East Africa.',
};

const CompanyConfigContext = createContext<CompanyConfigContextType | undefined>(undefined);

// Server-side public endpoint returning clean branding merged with saved overrides
async function fetchCompanyConfig(): Promise<Partial<CompanyConfig> | null> {
  try {
    const apiUrl = getClientApiUrl();
    const res = await fetch(`${apiUrl}?action=company_config`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status === 'success' && json.data) {
      return json.data;
    }
    return null;
  } catch {
    return null;
  }
}

export function CompanyConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<CompanyConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Load company branding: prefer the local public company_config (clean
  // Haemonetics branding + admin overrides), fall back to the DB accounts read,
  // then to built-in defaults. Never throws the public site down if one layer
  // is unavailable.
  const loadCompanyConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1) Local public config (no auth required; clean merged branding)
      const localCfg = await fetchCompanyConfig();

      // 2) DB accounts read (fallback; maps companies -> accounts)
      let dbCfg: Partial<CompanyConfig> | null = null;
      try {
        const database = getDatabase();
        if (database) {
          const result = await database.select('companies', {}, true);
          if (result.data && result.data.length > 0) {
            const cd = result.data[0];
            dbCfg = {
              name: cd.name,
              email: cd.email,
              phone: cd.phone,
              address: cd.address,
              city: cd.city,
              country: cd.country,
              logo_url: cd.logo_url,
              primary_color: cd.primary_color,
              currency: cd.currency,
              description: cd.description,
              pdf_background_image: cd.pdf_background_image,
              pdf_background_opacity: cd.pdf_background_opacity,
            };
          }
        }
      } catch (e) {
        // DB read optional — local config preferred
      }

      // Merge: local config takes priority, then DB, then defaults
      const source = localCfg || dbCfg || {};
      if (!localCfg && !dbCfg) {
        console.warn('⚠️  No company config source available, using defaults');
      }

      const loadedConfig: CompanyConfig = {
        id: 'default',
        name: source.name || defaultConfig.name,
        email: source.email || defaultConfig.email,
        phone: source.phone || defaultConfig.phone,
        address: source.address || defaultConfig.address,
        city: source.city || defaultConfig.city,
        country: source.country || defaultConfig.country,
        currency: source.currency || defaultConfig.currency,
        logo_url: source.logo_url || defaultConfig.logo_url,
        primary_color: source.primary_color || defaultConfig.primary_color,
        description: source.description || defaultConfig.description,
        pdf_background_image: source.pdf_background_image || null,
        pdf_background_opacity: source.pdf_background_opacity ?? null,
      };

      console.log('✅ Company config loaded:', loadedConfig.name, '- logo:', loadedConfig.logo_url);
      setConfig(loadedConfig);
      setActiveCompanyConfig({
        currency: loadedConfig.currency,
        pdf_background_image: loadedConfig.pdf_background_image,
        pdf_background_opacity: loadedConfig.pdf_background_opacity,
      });
      updateFavicon(loadedConfig.logo_url, loadedConfig);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('❌ Error loading company config:', error);
      logError('CompanyConfigContext: Error loading company config', error, {
        context: 'loadCompanyConfig',
      });
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

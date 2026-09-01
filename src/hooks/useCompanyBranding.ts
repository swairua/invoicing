import { useEffect } from 'react';
import { useCurrentCompany } from '@/contexts/CompanyContext';
import { getColorAsHslVar, lightenColor, darkenColor } from '@/utils/colorUtils';

export const useCompanyBranding = () => {
  const { currentCompany } = useCurrentCompany();

  useEffect(() => {
    const primaryColor = currentCompany?.primary_color || '#6B7280';
    const root = document.documentElement;

    root.style.setProperty('--primary', getColorAsHslVar(primaryColor));
    root.style.setProperty('--primary-hover', getColorAsHslVar(darkenColor(primaryColor, 10)));
    root.style.setProperty('--primary-light', getColorAsHslVar(lightenColor(primaryColor, 25)));
    root.style.setProperty('--primary-foreground', '0 0% 100%');
  }, [currentCompany?.primary_color]);
};

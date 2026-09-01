import { cn } from "@/lib/utils";

interface BiolegendLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  // Optional props to pass company data directly (useful for public pages like login)
  logoUrl?: string;
  companyName?: string;
}

import { useContext } from 'react';
import { CompanyContext } from '@/contexts/CompanyContext';
import { useCompanyConfig } from '@/contexts/CompanyConfigContext';

export function BiolegendLogo({
  className,
  size = "md",
  showText = true,
  logoUrl: propLogoUrl,
  companyName: propCompanyName
}: BiolegendLogoProps) {
  // Safely try to get company context (won't throw if provider is missing)
  const context = useContext(CompanyContext);
  const currentCompany = context?.currentCompany;
  const publicCompany = useCompanyConfig();

  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-16 w-16",
    lg: "h-20 w-20"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl"
  };

  const fallbackLogoUrl = '/fallback-logo.svg';
  const logoSrc = propLogoUrl || currentCompany?.logo_url || publicCompany.logo_url || fallbackLogoUrl;
  const companyName = propCompanyName || currentCompany?.name || publicCompany.name || 'Your Company';

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      {/* Company Logo Image (falls back to default) */}
      <div className={cn("relative", sizeClasses[size])}>
        <img
          src={logoSrc}
          alt={`${companyName} Logo`}
          className="w-full h-full object-contain"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            if (img.src !== `${window.location.origin}${fallbackLogoUrl}`) {
              img.src = fallbackLogoUrl;
            }
          }}
        />
      </div>

      {/* Company Text */}
      {showText && companyName && (
        <div className="flex flex-col">
          <span className={cn("font-bold text-primary", textSizeClasses[size])}>
            {companyName.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}

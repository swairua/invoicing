import { Building, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrentCompany } from '@/contexts/CompanyContext';

export function CompanySwitcher() {
  const { companies, currentCompany, switchCompany } = useCurrentCompany();

  if (!companies || companies.length <= 1) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2 px-3 h-auto">
          <Building className="h-4 w-4" />
          <span className="hidden sm:inline text-sm font-medium max-w-[150px] truncate">
            {currentCompany?.company_name || 'Select Company'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Switch Company</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => switchCompany(company.id)}
            className="cursor-pointer flex items-center justify-between"
          >
            <span>{company.company_name}</span>
            {currentCompany?.id === company.id && (
              <Check className="h-4 w-4 text-success" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

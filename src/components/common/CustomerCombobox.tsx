import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  customer_code?: string;
}

interface CustomerComboboxProps {
  customers?: Customer[];
  selectedCustomerId: string;
  onCustomerChange: (customerId: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  label?: string;
  required?: boolean;
  onAddCustomerClick?: () => void;
}

export function CustomerCombobox({
  customers = [],
  selectedCustomerId,
  onCustomerChange,
  isLoading = false,
  placeholder = 'Select a customer',
  label = 'Customer',
  required = false,
  onAddCustomerClick,
}: CustomerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);

  useEffect(() => {
    if (!searchInput.trim()) {
      setFilteredCustomers(customers || []);
    } else {
      const lowerSearchInput = searchInput.toLowerCase();
      setFilteredCustomers(
        (customers || []).filter(customer =>
          customer.name.toLowerCase().includes(lowerSearchInput) ||
          customer.customer_code?.toLowerCase().includes(lowerSearchInput)
        )
      );
    }
  }, [searchInput, customers]);

  // Focus search input when popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    } else {
      setSearchInput('');
    }
  }, [open]);

  const handleSelect = (customerId: string) => {
    onCustomerChange(customerId);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label} {required && '*'}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </>
            ) : selectedCustomer ? (
              <span>
                {selectedCustomer.name}
                {selectedCustomer.customer_code && ` (${selectedCustomer.customer_code})`}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          {onAddCustomerClick && (
            <div className="p-2 border-b">
              <button
                onClick={() => {
                  onAddCustomerClick();
                  setOpen(false);
                }}
                className="w-full text-left px-2 py-2 text-sm font-medium text-primary hover:bg-muted rounded transition-colors"
              >
                + Create New Customer
              </button>
            </div>
          )}
          <div className="p-2 border-b">
            <Input
              ref={searchInputRef}
              placeholder="Search by name or code..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filteredCustomers.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                {customers && customers.length === 0
                  ? 'No customers found. Create customers first.'
                  : searchInput
                  ? 'No customers match your search.'
                  : 'No customers available.'}
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleSelect(customer.id)}
                  className={cn(
                    'w-full text-left px-2 py-2 text-sm hover:bg-muted flex items-center justify-between cursor-pointer',
                    selectedCustomerId === customer.id && 'bg-muted'
                  )}
                >
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    {customer.customer_code && (
                      <div className="text-xs text-muted-foreground">{customer.customer_code}</div>
                    )}
                  </div>
                  {selectedCustomerId === customer.id && (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

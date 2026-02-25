import React, { useMemo, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowRight, Trash2, Search, Plus } from 'lucide-react';
import { formatCurrency } from '@/utils/taxCalculation';
import { useProducts, useTaxSettings } from '@/hooks/useDatabase';
import { calculateLineItemTotal } from '@/hooks/useQuotationItems';
import { useCurrentCompany } from '@/contexts/CompanyContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface ConversionSourceData {
  id: string;
  number: string;
  date: string;
  customer?: {
    name: string;
    email?: string;
  };
  items?: Array<{
    product_id?: string;
    description: string;
    quantity: number;
    unit_price: number;
    tax_percentage?: number;
    tax_inclusive?: boolean;
    tax_amount?: number;
    line_total: number;
  }>;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
}

export interface ConversionDestinationData {
  documentType: 'proforma' | 'invoice'; // The new document type
  number?: string; // Will be auto-generated
  date: string; // Today's date
  dueDate?: string; // For invoices
  status: 'draft' | 'sent';
  conversionImpact: string[];
}

interface ConversionPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceDocument: ConversionSourceData;
  sourceDocumentType: 'quotation' | 'proforma';
  destinationData: ConversionDestinationData;
  isLoading?: boolean;
  onConfirm: (modifiedData?: any) => void | Promise<void>;
  onCancel?: () => void;
}

const getDocumentTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    quotation: 'Quotation',
    proforma: 'Proforma Invoice',
    invoice: 'Invoice',
  };
  return labels[type] || type;
};

const getDocumentTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    quotation: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
    proforma: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800',
    invoice: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
  };
  return colors[type] || '';
};

export function ConversionPreviewModal({
  open,
  onOpenChange,
  sourceDocument,
  sourceDocumentType,
  destinationData,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConversionPreviewModalProps) {
  const { currentCompany } = useCurrentCompany();
  const { data: products } = useProducts(currentCompany?.id);
  const { data: taxSettings } = useTaxSettings(currentCompany?.id);

  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);

  const defaultTaxRate = useMemo(() => {
    if (!taxSettings || !Array.isArray(taxSettings)) return 0;
    const defaultTax = (taxSettings as any[]).find((t: any) => t.is_default);
    return defaultTax ? parseFloat(defaultTax.rate) : (parseFloat(taxSettings[0]?.rate) || 0);
  }, [taxSettings]);

  // Initialize items from sourceDocument
  useEffect(() => {
    if (open && sourceDocument.items) {
      setItems(sourceDocument.items.map(item => {
        const result = calculateLineItemTotal({
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_percentage: item.tax_percentage ?? 0,
          tax_inclusive: item.tax_inclusive ?? false
        });
        return {
          ...item,
          tax_percentage: item.tax_percentage ?? 0,
          tax_inclusive: item.tax_inclusive ?? false,
          tax_amount: result.tax_amount,
          line_total: result.line_total
        };
      }));
    }
  }, [open, sourceDocument.items]);

  const destinationLabel = getDocumentTypeLabel(destinationData.documentType);
  const sourceLabel = getDocumentTypeLabel(sourceDocumentType);

  // Recalculate totals
  const totals = useMemo(() => {
    let subtotal = 0;
    let tax_amount = 0;
    let total_amount = 0;

    items.forEach((item) => {
      // Always recalculate line totals to ensure consistency
      const result = calculateLineItemTotal({
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_percentage: item.tax_percentage,
        tax_inclusive: item.tax_inclusive
      });
      subtotal += result.subtotal;
      tax_amount += result.tax_amount;
      total_amount += result.line_total;
    });

    return { subtotal, tax_amount, total_amount };
  }, [items]);

  const updateItem = (index: number, updates: any) => {
    const newItems = [...items];
    const item = newItems[index];
    const updatedItem = { ...item, ...updates };

    // Process numeric values carefully to avoid snapping
    let qty = updatedItem.quantity;
    let price = updatedItem.unit_price;

    if ('quantity' in updates) {
      qty = updates.quantity === '' ? 0 : parseFloat(updates.quantity);
      if (isNaN(qty)) qty = item.quantity;
    }
    if ('unit_price' in updates) {
      price = updates.unit_price === '' ? 0 : parseFloat(updates.unit_price);
      if (isNaN(price)) price = item.unit_price;
    }

    // Recalculate line totals
    const result = calculateLineItemTotal({
      quantity: qty,
      unit_price: price,
      tax_percentage: updatedItem.tax_percentage,
      tax_inclusive: updatedItem.tax_inclusive
    });

    newItems[index] = {
      ...updatedItem,
      quantity: qty,
      unit_price: price,
      tax_amount: result.tax_amount,
      line_total: result.line_total
    };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const addProduct = (product: any) => {
    // Check if product already exists in items
    const existingItemIndex = items.findIndex(item => item.product_id === product.id);

    if (existingItemIndex > -1) {
      // Increment quantity for existing item
      const existingItem = items[existingItemIndex];
      const newQuantity = (existingItem.quantity || 0) + 1;

      const result = calculateLineItemTotal({
        ...existingItem,
        quantity: newQuantity,
      });

      const newItems = [...items];
      newItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        tax_amount: result.tax_amount,
        line_total: result.line_total
      };
      setItems(newItems);
    } else {
      // Add as new item
      const newItem = {
        product_id: product.id,
        description: product.name,
        quantity: 1,
        unit_price: parseFloat(product.unit_price || product.selling_price || 0),
        tax_percentage: parseFloat(product.tax_percentage || defaultTaxRate),
        tax_inclusive: product.tax_inclusive === true || product.tax_inclusive === 1 || product.tax_inclusive === '1' || false,
      };

      const result = calculateLineItemTotal(newItem);
      setItems([...items, { ...newItem, tax_amount: result.tax_amount, line_total: result.line_total }]);
    }

    setSearchTerm('');
    setIsProductSearchOpen(false);
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    return (products || []).filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);
  }, [products, searchTerm]);

  // Format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleConfirm = async () => {
    try {
      await onConfirm({
        items,
        subtotal: totals.subtotal,
        tax_amount: totals.tax_amount,
        total_amount: totals.total_amount
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Conversion error:', error);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  // Memoize computed values
  const itemCount = useMemo(() => items.length, [items]);
  const statusLabel = useMemo(() => {
    return destinationData.status.charAt(0).toUpperCase() + destinationData.status.slice(1);
  }, [destinationData.status]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 sm:gap-3 text-lg">
            <span>Convert {sourceLabel}</span>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <span>{destinationLabel}</span>
          </DialogTitle>
          <DialogDescription>
            Review the conversion details below before confirming. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 w-full">
          {/* Destination Document Preview */}
          <div className="grid grid-cols-1 gap-4">
            {/* Destination Document */}
            <Card className={`border-2 ${getDocumentTypeColor(destinationData.documentType)}`}>
              <CardHeader>
                <CardTitle className="text-base">{destinationLabel}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Auto-generated info */}
                <div className="bg-muted/50 p-3 rounded text-sm space-y-1">
                  <p className="font-medium text-foreground">Will be auto-generated:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                    <li>Document number (e.g., {destinationData.documentType === 'invoice' ? 'INV-' : 'PROFORMA-'}...)</li>
                    <li>Created date: Today</li>
                    {destinationData.dueDate && <li>Due date: {formatDate(destinationData.dueDate)}</li>}
                  </ul>
                </div>

                {/* Document Details */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Number</span>
                    <Badge variant="outline">Auto-generated</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Date</span>
                    <span className="text-sm">{formatDate(destinationData.date)}</span>
                  </div>
                  {destinationData.dueDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Due Date</span>
                      <span className="text-sm">{formatDate(destinationData.dueDate)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Customer (same as source) */}
                {sourceDocument.customer && (
                  <div className="space-y-2">
                    <span className="text-muted-foreground text-sm block">Customer</span>
                    <div className="font-medium">{sourceDocument.customer.name}</div>
                  </div>
                )}

                <Separator />

                {/* Items (Editable) */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm block font-medium">
                      Items ({itemCount})
                    </span>

                    <Popover open={isProductSearchOpen} onOpenChange={setIsProductSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 gap-1">
                          <Plus className="h-3.5 w-3.5" />
                          Add Item
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="end">
                        <div className="p-2 border-b">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search products..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-8"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-1">
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                              <button
                                key={product.id}
                                className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded transition-colors"
                                onClick={() => addProduct(product)}
                              >
                                <div className="font-medium">{product.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {product.sku} - {formatCurrency(product.unit_price || product.selling_price || 0)}
                                </div>
                              </button>
                            ))
                          ) : searchTerm ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              No products found
                            </div>
                          ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              Start typing to search...
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="border rounded-md overflow-hidden">
                    <div className="max-h-60 overflow-y-auto overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0">
                          <tr>
                            <th className="text-left p-2 font-medium">Description</th>
                            <th className="text-center p-2 font-medium w-16">Qty</th>
                            <th className="text-right p-2 font-medium w-24">Price</th>
                            <th className="text-right p-2 font-medium w-24">Total</th>
                            <th className="w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {items.map((item, index) => (
                            <tr key={index} className="hover:bg-muted/30">
                              <td className="p-2">
                                <Input
                                  value={item.description}
                                  onChange={(e) => updateItem(index, { description: e.target.value })}
                                  className="h-8 text-xs px-2"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  step="any"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, { quantity: e.target.value })}
                                  className="h-8 text-xs px-1 text-center"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  step="any"
                                  value={item.unit_price}
                                  onChange={(e) => updateItem(index, { unit_price: e.target.value })}
                                  className="h-8 text-xs px-1 text-right"
                                />
                              </td>
                              <td className="p-2 text-right text-xs">
                                {formatCurrency(item.line_total)}
                              </td>
                              <td className="p-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => removeItem(index)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                          {items.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                                No items. Add an item to continue.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Status and Amounts */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="outline">{statusLabel}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(totals.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(totals.total_amount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversion Impact */}
          {destinationData.conversionImpact.length > 0 && (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-amber-900 dark:text-amber-100">
                  Conversion Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {destinationData.conversionImpact.map((impact, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-100">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 mt-1.5 flex-shrink-0" />
                      {impact}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? 'Converting...' : `Convert to ${destinationLabel}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

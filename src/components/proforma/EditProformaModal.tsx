import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Trash2,
  Search,
  Calculator,
  Receipt,
  Edit,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCustomers, useProducts, useTaxSettings } from '@/hooks/useDatabase';
import { useCreateQuotationWithItems } from '@/hooks/useQuotationItems';
import { useUpdateProforma } from '@/hooks/useProforma';
import { externalApiAdapter } from '@/integrations/database/external-api-adapter';
import { toast } from 'sonner';

interface ProformaItem {
  id: string;
  product_id: string;
  product_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_percentage: number;
  tax_amount: number;
  tax_inclusive: boolean;
  line_total: number;
}

interface Proforma {
  id: string;
  proforma_number: string;
  customer_id: string;
  proforma_date: string;
  valid_until: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  terms_and_conditions?: string;
  customers?: {
    name: string;
    email?: string;
  };
  proforma_items?: ProformaItem[];
}

interface EditProformaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proforma: Proforma | null;
  onSuccess?: () => void;
  companyId?: string;
}

export const EditProformaModal = ({ 
  open, 
  onOpenChange, 
  proforma,
  onSuccess,
  companyId = '550e8400-e29b-41d4-a716-446655440000' 
}: EditProformaModalProps) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    proforma_date: '',
    valid_until: '',
    notes: '',
    terms_and_conditions: '',
    status: 'draft',
  });

  const [items, setItems] = useState<ProformaItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [itemsLoadError, setItemsLoadError] = useState<string | null>(null);

  const { data: customers } = useCustomers(companyId);
  const { data: products } = useProducts(companyId);
  const { data: taxSettings } = useTaxSettings(companyId);
  const updateProforma = useUpdateProforma();

  const defaultTaxRate = taxSettings?.find(t => t.is_default)?.rate || 0;

  // Populate form when proforma changes
  useEffect(() => {
    if (proforma && open) {
      setFormData({
        customer_id: proforma.customer_id,
        proforma_date: proforma.proforma_date,
        valid_until: proforma.valid_until,
        notes: proforma.notes || '',
        terms_and_conditions: proforma.terms_and_conditions || '',
        status: proforma.status,
      });
    }
  }, [proforma, open]);

  // Load proforma items when modal opens or proforma changes
  useEffect(() => {
    if (!open || !proforma?.id) {
      setItems([]);
      setItemsLoadError(null);
      return;
    }

    const loadProformaItems = async () => {
      try {
        setIsLoadingItems(true);
        setItemsLoadError(null);

        console.log('📦 Loading proforma items for:', proforma.id);
        const itemsResult = await externalApiAdapter.selectBy('proforma_items', { proforma_id: proforma.id });

        if (itemsResult.error) {
          console.error('Error fetching proforma items:', itemsResult.error);
          setItemsLoadError('Failed to load line items');
          setItems([]);
        } else if (itemsResult.data && itemsResult.data.length > 0) {
          // Enrich items with product names if not already present
          const enrichedItems = itemsResult.data.map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name || item.products?.name || 'Unknown Product',
            description: item.description || '',
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            tax_percentage: item.tax_percentage || defaultTaxRate,
            tax_amount: item.tax_amount || 0,
            tax_inclusive: item.tax_inclusive || false,
            line_total: item.line_total || 0,
          }));

          console.log('✅ Loaded', enrichedItems.length, 'items');
          setItems(enrichedItems);
        } else {
          console.log('ℹ️ No items found for proforma');
          setItems([]);
        }
      } catch (error) {
        console.error('Error loading proforma items:', error);
        setItemsLoadError('Failed to load line items. Please try again.');
        setItems([]);
      } finally {
        setIsLoadingItems(false);
      }
    };

    loadProformaItems();
  }, [open, proforma?.id, defaultTaxRate]);

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.product_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addItem = (product: any) => {
    const newItem: ProformaItem = {
      id: `item-${Date.now()}`,
      product_id: product.id,
      product_name: product.name,
      description: product.description || '',
      quantity: 1,
      unit_price: product.selling_price,
      tax_percentage: defaultTaxRate,
      tax_amount: 0,
      tax_inclusive: false,
      line_total: 0,
    };

    // Calculate tax and totals
    const updatedItem = calculateItemTotals(newItem);
    setItems(prev => [...prev, updatedItem]);
    setShowProductSearch(false);
    setSearchTerm('');
  };

  const updateItem = (id: string, field: keyof ProformaItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        let updatedItem = { ...item, [field]: value };

        // Special handling for tax_inclusive checkbox
        if (field === 'tax_inclusive') {
          // When checking VAT Inclusive, auto-apply default tax rate if no VAT is set
          if (value && item.tax_percentage === 0) {
            updatedItem.tax_percentage = defaultTaxRate;
          }
          // When unchecking VAT Inclusive, reset VAT to 0
          if (!value) {
            updatedItem.tax_percentage = 0;
          }
        }

        return calculateItemTotals(updatedItem);
      }
      return item;
    }));
  };

  const calculateItemTotals = (item: ProformaItem): ProformaItem => {
    const baseAmount = item.quantity * item.unit_price;

    // Both inclusive and exclusive now add VAT on top
    const taxAmount = baseAmount * (item.tax_percentage / 100);

    return {
      ...item,
      tax_amount: parseFloat(taxAmount.toFixed(2)),
      line_total: parseFloat((baseAmount + taxAmount).toFixed(2))
    };
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      // Always use base amount for subtotal (unit price × quantity)
      // VAT is calculated separately and added for exclusive, or extracted for inclusive
      return sum + (item.quantity * item.unit_price);
    }, 0);

    const totalTax = items.reduce((sum, item) => sum + item.tax_amount, 0);
    const total = subtotal + totalTax;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      totalTax: parseFloat(totalTax.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_id) {
      toast.error('Please select a customer');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    if (!proforma?.id) {
      toast.error('Invalid proforma ID');
      return;
    }

    try {
      // Prepare items for mutation - filter out temp IDs and format properly
      const itemsToUpdate = items.map(item => ({
        id: item.id,
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_percentage: item.tax_percentage,
        tax_amount: item.tax_amount,
        tax_inclusive: item.tax_inclusive,
        line_total: item.line_total,
      }));

      // Call the mutation to update proforma
      await updateProforma.mutateAsync({
        proformaId: proforma.id,
        proforma: {
          customer_id: formData.customer_id,
          proforma_date: formData.proforma_date,
          valid_until: formData.valid_until,
          status: formData.status,
          notes: formData.notes,
          terms_and_conditions: formData.terms_and_conditions,
        },
        items: itemsToUpdate,
      });

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Error updating proforma:', error);
      toast.error('Failed to update proforma invoice');
    }
  };

  const handleClose = () => {
    setSearchTerm('');
    setShowProductSearch(false);
    setIsLoadingItems(false);
    setItemsLoadError(null);
    onOpenChange(false);
  };

  const { subtotal, totalTax, total } = calculateTotals();

  if (!proforma) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Proforma Invoice #{proforma.proforma_number}
          </DialogTitle>
          <DialogDescription>
            Update proforma invoice details and items
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proforma_number">Proforma Number</Label>
              <Input
                id="proforma_number"
                value={proforma.proforma_number}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_id">Customer *</Label>
              <Select value={formData.customer_id || ''} onValueChange={(value) =>
                setFormData(prev => ({ ...prev, customer_id: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status || ''} onValueChange={(value) =>
                setFormData(prev => ({ ...prev, status: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proforma_date">Proforma Date</Label>
              <Input
                id="proforma_date"
                type="date"
                value={formData.proforma_date}
                onChange={(e) => setFormData(prev => ({ ...prev, proforma_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid_until">Valid Until</Label>
              <Input
                id="valid_until"
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
              />
            </div>
          </div>

          {/* Items Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Items
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProductSearch(true)}
                  disabled={isLoadingItems}
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Loading State */}
              {isLoadingItems && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <p className="text-sm text-muted-foreground animate-pulse">Loading line items...</p>
                </div>
              )}

              {/* Error State */}
              {itemsLoadError && !isLoadingItems && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {itemsLoadError}
                  </AlertDescription>
                </Alert>
              )}

              {showProductSearch && (
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-sm">Add Product</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search products..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                          disabled={isLoadingItems}
                        />
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {filteredProducts && filteredProducts.length > 0 ? (
                          filteredProducts.map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted/50"
                              onClick={() => addItem(product)}
                            >
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {product.product_code} • ${product.selling_price}
                                </p>
                              </div>
                              <Button size="sm" variant="ghost">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-sm text-muted-foreground py-4">
                            {searchTerm ? 'No products found' : 'No products available'}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowProductSearch(false)}
                        className="w-full"
                        disabled={isLoadingItems}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!isLoadingItems && items.length === 0 && !itemsLoadError && (
                <div className="text-center py-8 text-muted-foreground">
                  No items added yet. Click "Add Item" to start.
                </div>
              )}

              {!isLoadingItems && items.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Tax %</TableHead>
                      <TableHead>Tax Incl.</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            placeholder="Description"
                            className="min-w-32"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.tax_percentage}
                            onChange={(e) => updateItem(item.id, 'tax_percentage', parseFloat(e.target.value) || 0)}
                            min="0"
                            max="100"
                            step="0.01"
                            className="w-20"
                            disabled={item.tax_inclusive}
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={item.tax_inclusive}
                            onCheckedChange={(checked) => updateItem(item.id, 'tax_inclusive', checked)}
                          />
                        </TableCell>
                        <TableCell>${item.line_total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Totals */}
              {items.length > 0 && (
                <div className="mt-6 space-y-2 max-w-sm ml-auto">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${totalTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Internal notes..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms_and_conditions">Terms & Conditions</Label>
              <Textarea
                id="terms_and_conditions"
                value={formData.terms_and_conditions}
                onChange={(e) => setFormData(prev => ({ ...prev, terms_and_conditions: e.target.value }))}
                placeholder="Terms and conditions..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={updateProforma.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.customer_id || items.length === 0 || updateProforma.isPending}
            >
              {updateProforma.isPending ? 'Updating...' : 'Update Proforma'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

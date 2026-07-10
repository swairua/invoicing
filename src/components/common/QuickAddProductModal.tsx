import { useState, useMemo } from 'react';
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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateProduct, useCategories } from '@/hooks/useDatabase';
import { formatError } from '@/lib/utils';

interface QuickAddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newProduct: any) => void;
  companyId: string;
}

export function QuickAddProductModal({
  open,
  onOpenChange,
  onSuccess,
  companyId,
}: QuickAddProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    unit_price: '',
    selling_price: '',
    description: '',
    category_id: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createProduct = useCreateProduct();
  const { data: categories } = useCategories(companyId);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    const price = parseFloat(formData.unit_price || formData.selling_price || '0');
    if (!price || price <= 0) {
      toast.error('Product price must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        company_id: companyId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        unit_price: price,
        selling_price: price,
        cost_price: 0,
        stock_quantity: 0,
        minimum_stock_level: 0,
        category_id: formData.category_id || null,
        is_active: true,
      };

      const created = await createProduct.mutateAsync(payload);

      toast.success(`Product ${created?.name} created successfully!`);
      onSuccess(created);
      onOpenChange(false);

      setFormData({
        name: '',
        unit_price: '',
        selling_price: '',
        description: '',
        category_id: '',
      });
    } catch (error: unknown) {
      console.error('Error creating product:', error);
      const message = formatError(error);
      toast.error(`Failed to create product: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
          <DialogDescription>
            Add a new product quickly. You can edit more details later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="product-name">Name *</Label>
            <Input
              id="product-name"
              placeholder="Enter product name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-price">Price *</Label>
            <Input
              id="product-price"
              type="number"
              placeholder="Enter unit price"
              value={formData.unit_price || formData.selling_price}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  unit_price: value,
                  selling_price: value,
                }));
              }}
              disabled={isSubmitting}
              step="0.01"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-description">Description</Label>
            <Textarea
              id="product-description"
              placeholder="Enter product description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-category">Category</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category_id: value }))
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="product-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

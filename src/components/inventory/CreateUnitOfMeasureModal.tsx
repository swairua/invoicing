import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentCompany } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Ruler, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface CreateUnitOfMeasureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (unitId: string, unitName: string) => void;
}

interface UnitOfMeasureData {
  name: string;
  abbreviation: string;
}

export function CreateUnitOfMeasureModal({ open, onOpenChange, onSuccess }: CreateUnitOfMeasureModalProps) {
  const [formData, setFormData] = useState<UnitOfMeasureData>({
    name: '',
    abbreviation: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentCompany } = useCurrentCompany();
  const queryClient = useQueryClient();

  const createUnitMutation = useMutation({
    mutationFn: async (unitData: UnitOfMeasureData) => {
      if (!currentCompany?.id) {
        throw new Error('Company not found. Please refresh and try again.');
      }

      const insertData = {
        company_id: currentCompany.id,
        name: unitData.name.trim(),
        abbreviation: unitData.abbreviation.trim(),
        is_active: true
      };

      const { data, error } = await supabase
        .from('units_of_measure')
        .insert(insertData)
        .select('id, name, abbreviation')
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['units_of_measure'] });
      toast.success(`Unit of measure "${data.name}" created successfully!`);
      onSuccess?.(data.id, data.name);
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      let errorMessage = 'Failed to create unit of measure. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        const supabaseError = error as Record<string, unknown>;
        if (supabaseError.message) {
          errorMessage = supabaseError.message;
        } else if (supabaseError.details) {
          errorMessage = supabaseError.details;
        }
      }
      
      toast.error(errorMessage);
    }
  });

  const handleInputChange = (field: keyof UnitOfMeasureData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Unit name is required');
      return;
    }

    if (!formData.abbreviation.trim()) {
      toast.error('Abbreviation is required');
      return;
    }

    if (!currentCompany?.id) {
      toast.error('No company found. Please refresh the page and try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createUnitMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      abbreviation: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Ruler className="h-5 w-5 text-primary" />
            <span>Create Unit of Measure</span>
          </DialogTitle>
          <DialogDescription>
            Add a new unit of measure for your products
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="unit-name">Unit Name *</Label>
            <Input
              id="unit-name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Kilogram, Liter, Piece"
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit-abbreviation">Abbreviation *</Label>
            <Input
              id="unit-abbreviation"
              value={formData.abbreviation}
              onChange={(e) => handleInputChange('abbreviation', e.target.value)}
              placeholder="e.g., kg, L, pc"
              maxLength={10}
            />
          </div>

          <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
            Examples: kg (Kilogram), L (Liter), m (Meter), pc (Pieces), box (Box)
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !formData.name.trim() || !formData.abbreviation.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Creating...' : 'Create Unit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { getDatabase } from '@/integrations/database';

export interface WebCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  variant_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface WebVariant {
  id: string;
  category_id: string;
  name: string;
  sku: string;
  slug: string;
  description?: string;
  image_path?: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryFormData {
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  display_order: number;
  is_active: boolean;
}

export interface VariantImage {
  id?: string;
  url: string;
  altText?: string;
  displayOrder: number;
}

export interface VariantFormData {
  category_id: string;
  name: string;
  sku: string;
  slug: string;
  description?: string;
  image_path?: string;
  display_order: number;
  is_active: boolean;
}

export interface WebVariantWithImages extends WebVariant {
  images?: VariantImage[];
}

export const useWebManager = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Categories
  const fetchCategories = useCallback(
    async (search?: string, limit?: number) => {
      try {
        setLoading(true);
        setError(null);

        const db = getDatabase();
        const result = await db.selectBy('web_categories', {});

        if (result.error) throw result.error;

        let categories = (result.data || []) as WebCategory[];

        // Apply search filter (client-side)
        if (search) {
          const searchLower = search.toLowerCase();
          categories = categories.filter((c: any) =>
            c.name && c.name.toLowerCase().includes(searchLower)
          );
        }

        // Sort by display_order
        categories = categories.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));

        // Apply limit
        if (limit) {
          categories = categories.slice(0, limit);
        }

        return categories;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch categories';
        setError(message);
        toast.error(message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createCategory = useCallback(async (data: CategoryFormData) => {
    try {
      setLoading(true);
      setError(null);

      const db = getDatabase();
      const result = await db.insert('web_categories', data);

      if (result.error) throw result.error;
      if (!result.id) throw new Error('Failed to create category: no ID returned');

      const selectResult = await db.selectOne('web_categories', result.id);
      if (selectResult.error) throw selectResult.error;

      toast.success('Category created successfully');
      return selectResult.data as WebCategory;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create category';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCategory = useCallback(async (id: string, data: CategoryFormData) => {
    try {
      setLoading(true);
      setError(null);

      const db = getDatabase();
      const result = await db.update('web_categories', id, data);

      if (result.error) throw result.error;

      const selectResult = await db.selectOne('web_categories', id);
      if (selectResult.error) throw selectResult.error;

      toast.success('Category updated successfully');
      return selectResult.data as WebCategory;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update category';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const db = getDatabase();
      const result = await db.delete('web_categories', id);

      if (result.error) throw result.error;
      toast.success('Category deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete category';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleCategoryStatus = useCallback(async (id: string, isActive: boolean) => {
    try {
      setError(null);

      const db = getDatabase();
      const result = await db.update('web_categories', id, { is_active: isActive });

      if (result.error) throw result.error;
      toast.success(`Category ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle category status';
      setError(message);
      toast.error(message);
      throw err;
    }
  }, []);

  // Variants
  const fetchVariants = useCallback(async (categoryId?: string, search?: string) => {
    try {
      setLoading(true);
      setError(null);

      const db = getDatabase();
      const filter: Record<string, any> = {};

      if (categoryId) {
        filter.category_id = categoryId;
      }

      const result = await db.selectBy('web_variants', filter);

      if (result.error) throw result.error;

      let variants = (result.data || []) as WebVariant[];

      // Apply search filter (client-side)
      if (search) {
        const searchLower = search.toLowerCase();
        variants = variants.filter((v: any) =>
          (v.name && v.name.toLowerCase().includes(searchLower)) ||
          (v.sku && v.sku.toLowerCase().includes(searchLower))
        );
      }

      // Sort by display_order
      variants = variants.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));

      return variants;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch variants';
      setError(message);
      toast.error(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createVariant = useCallback(async (data: VariantFormData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Creating variant with data:', data);

      const db = getDatabase();
      const result = await db.insert('web_variants', data);

      if (result.error) {
        console.error('Database error creating variant:', result.error);
        throw result.error;
      }

      if (!result.id) throw new Error('Failed to create variant: no ID returned');

      const selectResult = await db.selectOne('web_variants', result.id);
      if (selectResult.error) throw selectResult.error;

      console.log('Variant created successfully:', selectResult.data);
      toast.success('Variant created successfully');
      return selectResult.data as WebVariant;
    } catch (err) {
      let message = 'Failed to create variant';

      // Handle database errors with specific error messages
      if (err && typeof err === 'object') {
        if ('code' in err) {
          const code = (err as any).code;
          if (code === '23505') {
            // Unique constraint violation
            message = 'A variant with this SKU already exists. Please use a unique SKU.';
          } else if (code === '23503') {
            // Foreign key constraint violation
            message = 'The selected category does not exist. Please select a valid category.';
          } else if (code === '42P01') {
            // Table does not exist
            message = 'Database table not found. Please contact support.';
          } else if ('message' in err && typeof (err as any).message === 'string') {
            message = (err as any).message;
          } else {
            message = `Database Error (${code}): Check your input and try again.`;
          }
        } else if ('message' in err && typeof (err as any).message === 'string') {
          message = (err as any).message;
        } else {
          try {
            message = JSON.stringify(err);
          } catch {
            message = String(err);
          }
        }
      } else if (err instanceof Error) {
        message = err.message;
      } else {
        try {
          message = String(err);
        } catch {
          message = 'Failed to create variant';
        }
      }

      console.error('Create variant error:', message, err);
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateVariant = useCallback(async (id: string, data: VariantFormData) => {
    try {
      setLoading(true);
      setError(null);

      const db = getDatabase();
      const result = await db.update('web_variants', id, data);

      if (result.error) throw result.error;

      const selectResult = await db.selectOne('web_variants', id);
      if (selectResult.error) throw selectResult.error;

      toast.success('Variant updated successfully');
      return selectResult.data as WebVariant;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update variant';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteVariant = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const db = getDatabase();
      const result = await db.delete('web_variants', id);

      if (result.error) throw result.error;
      toast.success('Variant deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete variant';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleVariantStatus = useCallback(async (id: string, isActive: boolean) => {
    try {
      setError(null);

      const db = getDatabase();
      const result = await db.update('web_variants', id, { is_active: isActive });

      if (result.error) throw result.error;
      toast.success(`Variant ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle variant status';
      setError(message);
      toast.error(message);
      throw err;
    }
  }, []);

  // Variant Images
  const fetchVariantImages = useCallback(async (variantId: string) => {
    try {
      setError(null);

      const db = getDatabase();
      const result = await db.selectBy('variant_images', { variant_id: variantId });

      if (result.error) throw result.error;

      let images = (result.data || []);
      // Sort by display_order
      images = images.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));

      return images.map((img: any) => ({
        id: img.id,
        url: img.image_url,
        altText: img.alt_text || '',
        displayOrder: img.display_order,
      })) as VariantImage[];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch variant images';
      setError(message);
      return [];
    }
  }, []);

  const saveVariantImages = useCallback(
    async (variantId: string, images: VariantImage[]) => {
      try {
        setError(null);

        // Skip if no images to save
        if (images.length === 0) {
          return true;
        }

        // Delete existing images for this variant
        const db = getDatabase();
        const deleteResult = await db.deleteMany('variant_images', { variant_id: variantId });

        if (deleteResult.error) {
          // Check if it's a "table not found" error
          const deleteErrorStr = String(deleteResult.error);
          if (deleteErrorStr.includes('variant_images') && deleteErrorStr.includes('does not exist')) {
            console.warn('variant_images table not found - images will not be saved. Run the migration first.');
            toast.warning(
              'Images table not set up yet. Please run the database migration and try again.'
            );
            // Don't throw - allow variant to be created without images
            return false;
          }
          console.error('Error deleting existing variant images:', deleteResult.error);
          throw deleteResult.error;
        }

        // Insert new images if any
        if (images.length > 0) {
          const imagesToInsert = images.map((img, index) => {
            const data = {
              variant_id: variantId,
              image_url: img.url,
              alt_text: img.altText || '',
              display_order: img.displayOrder ?? index,
            };
            console.log(`Preparing to insert image ${index}:`, data);
            return data;
          });

          console.log('Inserting variant images:', imagesToInsert);
          const insertResult = await db.insertMany('variant_images', imagesToInsert);

          if (insertResult.error) {
            // Check if it's a "table not found" error
            const insertErrorStr = String(insertResult.error);
            if (insertErrorStr.includes('variant_images') && insertErrorStr.includes('does not exist')) {
              console.warn('variant_images table not found - images will not be saved. Run the migration first.');
              toast.warning(
                'Images table not set up yet. Variant created but images could not be saved.'
              );
              // Don't throw - variant was created successfully
              return false;
            }
            console.error('Error inserting variant images:', insertResult.error);
            console.error('Attempted to insert:', imagesToInsert);
            throw insertResult.error;
          }

          console.log('Successfully inserted variant images:', insertResult);
        }

        toast.success('Variant images saved successfully');
        return true;
      } catch (err) {
        let message = 'Failed to save variant images';

        // Handle Supabase errors with specific error codes
        if (err && typeof err === 'object') {
          if ('code' in err) {
            const code = err.code;
            if (code === '23503') {
              // Foreign key constraint violation
              message = 'Variant not found. Please create the variant first.';
            } else if (code === '42P01') {
              // Table does not exist
              message = 'Database table not found. Please run the migration.';
            } else if ('message' in err && typeof err.message === 'string') {
              message = err.message;
            } else {
              message = `Database Error (${code})`;
            }
          } else if ('message' in err && typeof err.message === 'string') {
            message = err.message;
          } else {
            try {
              message = JSON.stringify(err);
            } catch {
              message = String(err);
            }
          }
        } else if (err instanceof Error) {
          message = err.message;
        } else {
          try {
            message = String(err);
          } catch {
            message = 'Failed to save variant images';
          }
        }

        console.error('saveVariantImages error:', message, err);
        setError(message);
        toast.error(message);
        throw err;
      }
    },
    []
  );

  const deleteVariantImage = useCallback(async (imageId: string) => {
    try {
      setError(null);

      const db = getDatabase();
      const result = await db.delete('variant_images', imageId);

      if (result.error) throw result.error;
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete image';
      setError(message);
      toast.error(message);
      return false;
    }
  }, []);

  return {
    loading,
    error,
    // Categories
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    // Variants
    fetchVariants,
    createVariant,
    updateVariant,
    deleteVariant,
    toggleVariantStatus,
    // Variant Images
    fetchVariantImages,
    saveVariantImages,
    deleteVariantImage,
  };
};

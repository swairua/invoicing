import { apiClient } from '@/integrations/api';

export interface WebCategoryForPublic {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  display_order: number;
  variant_count?: number;
}

export interface WebVariantForPublic {
  id: string;
  category_id: string;
  name: string;
  sku: string;
  slug: string;
  description?: string;
  image_path?: string;
  display_order: number;
}

/**
 * Fetch all active categories for public display
 */
export const getActiveCategories = async (): Promise<WebCategoryForPublic[]> => {
  try {
    const { data, error } = await apiClient.query('web_categories_with_counts')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .execute();

    if (error) throw error;
    return (Array.isArray(data) ? data : []) || [];
  } catch (error) {
    console.error('Error fetching active categories:', error);
    return [];
  }
};

/**
 * Fetch a specific category by slug with its active variants
 */
export const getCategoryBySlugWithVariants = async (
  slug: string
): Promise<{
  category?: WebCategoryForPublic;
  variants: WebVariantForPublic[];
} | null> => {
  try {
    // Fetch category
    const { data: categoryData, error: categoryError } = await apiClient.query('web_categories')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (categoryError) {
      throw categoryError;
    }

    // Fetch variants for this category
    let variants: WebVariantForPublic[] = [];
    if (categoryData) {
      const { data: variantsData, error: variantsError } = await apiClient.query('web_variants')
        .eq('category_id', categoryData.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .execute();

      if (variantsError) throw variantsError;
      variants = (Array.isArray(variantsData) ? variantsData : []) || [];
    }

    return {
      category: categoryData || undefined,
      variants,
    };
  } catch (error) {
    console.error('Error fetching category with variants:', error);
    return null;
  }
};

/**
 * Fetch all active variants (optionally filtered by category)
 */
export const getActiveVariants = async (
  categoryId?: string
): Promise<WebVariantForPublic[]> => {
  try {
    let query = apiClient.query('web_variants')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query.execute();

    if (error) throw error;
    return (Array.isArray(data) ? data : []) || [];
  } catch (error) {
    console.error('Error fetching active variants:', error);
    return [];
  }
};

/**
 * Fetch a specific variant by slug
 */
export const getVariantBySlug = async (slug: string): Promise<WebVariantForPublic | null> => {
  try {
    const { data, error } = await apiClient.query('web_variants')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error fetching variant by slug:', error);
    return null;
  }
};

/**
 * Get category names for navigation/dropdown (optimized for UI)
 */
export const getCategoryNames = async (): Promise<string[]> => {
  try {
    const { data, error } = await apiClient.query('web_categories')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .execute();

    if (error) throw error;
    return (Array.isArray(data) ? data.map((cat: any) => cat.name) : []) || [];
  } catch (error) {
    console.error('Error fetching category names:', error);
    return [];
  }
};

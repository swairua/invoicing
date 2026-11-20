import { apiClient } from '@/integrations/api';

export interface WebCategoryForPublic {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  image_path?: string;
  display_order: number;
  is_active?: boolean;
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
  is_active?: boolean;
}

/**
 * All public website reads go through the `public_read` action
 * (isPublic = true), which enforces a server-side allow-list of
 * tables and columns and needs no auth token.
 */
async function publicRead<T>(
  table: string,
  filter: Record<string, unknown> = {}
): Promise<T[]> {
  const { data, error } = await apiClient.select<T>(table, filter, true);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

const byDisplayOrder = (a: { display_order?: number }, b: { display_order?: number }) =>
  (a.display_order || 0) - (b.display_order || 0);

/**
 * Fetch all active categories for public display, with the number of
 * active variants each one has (computed client-side - the old
 * `web_categories_with_counts` view does not exist on the live DB).
 */
export const getActiveCategories = async (): Promise<WebCategoryForPublic[]> => {
  try {
    const [categories, variants] = await Promise.all([
      publicRead<WebCategoryForPublic>('web_categories', { is_active: true }),
      publicRead<WebVariantForPublic>('web_variants', { is_active: true }),
    ]);

    const counts: Record<string, number> = {};
    for (const v of variants) {
      counts[v.category_id] = (counts[v.category_id] || 0) + 1;
    }

    return categories
      .map((c) => ({ ...c, variant_count: counts[c.id] || 0 }))
      .sort(byDisplayOrder);
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
    const categories = await publicRead<WebCategoryForPublic>('web_categories', {
      slug,
      is_active: true,
    });
    const category = categories[0];
    if (!category) return null;

    const variants = await publicRead<WebVariantForPublic>('web_variants', {
      category_id: category.id,
      is_active: true,
    });

    return {
      category,
      variants: variants.sort(byDisplayOrder),
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
    const filter: Record<string, unknown> = { is_active: true };
    if (categoryId) filter.category_id = categoryId;

    const variants = await publicRead<WebVariantForPublic>('web_variants', filter);
    return variants.sort(byDisplayOrder);
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
    const variants = await publicRead<WebVariantForPublic>('web_variants', {
      slug,
      is_active: true,
    });
    return variants[0] || null;
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
    const categories = await publicRead<WebCategoryForPublic>('web_categories', {
      is_active: true,
    });
    return categories.sort(byDisplayOrder).map((cat) => cat.name);
  } catch (error) {
    console.error('Error fetching category names:', error);
    return [];
  }
};

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWebCategories, useWebVariants, WebCategoryForPublic, WebVariantForPublic } from '@/hooks/useWebCategories';
import { useCompanyConfig } from '@/hooks/useCompanyConfig';
import { useSEO } from '@/hooks/useSEO';
import { generateWebPageSchema, useBreadcrumbSchema } from '@/utils/seoHelpers';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';

/**
 * Products page: products grouped under Laboratory and Imaging
 * (web_categories → web_variants, read via the unauthenticated
 * public_read endpoint). Each item links to its department page
 * (/products/:slug) via ProductDetail.
 */
export default function PublicProducts() {
  const company = useCompanyConfig();
  const [search, setSearch] = useState('');

  const { categories, loading: categoriesLoading } = useWebCategories();
  const { variants, loading: variantsLoading } = useWebVariants();
  const loading = categoriesLoading || variantsLoading;

  useSEO(
    {
      title: `${company.name} Products`,
      description:
        'Browse our laboratory and imaging products. Laboratory: hematology, chemistry, microbiology and immunology. Imaging: CT Scan, X-Ray and ultrasound.',
      keywords:
        'laboratory equipment, imaging equipment, CT scanner, X-ray, ultrasound, diagnostics, medical supplies',
      url: '/products',
      image: company.logo_url,
    },
    generateWebPageSchema({
      title: `Products - ${company.name}`,
      description: 'Laboratory and imaging products grouped by department',
      url: '/products',
    }, company)
  );

  useBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
  ], company);

  // Filter items by search
  const filteredVariants = useMemo(() => {
    if (!search) return variants;
    const needle = search.toLowerCase().trim();
    return variants.filter(
      (v) =>
        v.name.toLowerCase().includes(needle) ||
        v.sku?.toLowerCase().includes(needle) ||
        v.description?.toLowerCase().includes(needle)
    );
  }, [variants, search]);

  // Group (filtered) variants under their category
  const filteredByCategory = useMemo(() => {
    const map = new Map<string, WebVariantForPublic[]>();
    for (const v of filteredVariants) {
      const key = String(v.category_id);
      const list = map.get(key) || [];
      list.push(v);
      map.set(key, list);
    }
    return map;
  }, [filteredVariants]);

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <PublicHeader />

      <BreadcrumbNav items={[
        { label: 'Products', href: '/products' },
      ]} />

      {/* Hero */}
      <section className="bg-gradient-to-r from-maroon to-neutral-700 text-white py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Our Products</h1>
          <p className="mt-4 text-lg text-white/85 max-w-2xl">
            Laboratory and imaging products grouped under your departments.
          </p>
          <Badge className="mt-6 bg-white/20 text-white border-white/30">
            {categories.length} departments • {variants.length} items
          </Badge>
        </div>
      </section>

      {/* Search */}
      <section className="py-8 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </section>

      {/* Products grouped under Laboratory / Imaging */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <>
              <Skeleton className="h-10 w-64 rounded-md mb-8" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full rounded-xl" />
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-14">
              {categories
                .filter((cat: WebCategoryForPublic) =>
                  filteredByCategory.get(String(cat.id))?.length
                )
                .map((cat: WebCategoryForPublic) => {
                  const items = filteredByCategory.get(String(cat.id)) || [];
                  return (
                    <div key={cat.id}>
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                            <span className="text-3xl">{cat.icon}</span>
                            {cat.name}
                          </h2>
                          {cat.description && (
                            <p className="text-slate-500 mt-1 max-w-2xl">{cat.description}</p>
                          )}
                        </div>
                        <Link
                          to={`/products/${cat.slug}`}
                          className="text-sm font-semibold text-maroon hover:underline"
                        >
                          View department →
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {items.map((v: WebVariantForPublic) => (
                          <ProductItem key={v.id} variant={v} />
                        ))}
                      </div>
                    </div>
                  );
                })}

              {filteredVariants.length === 0 && !loading && (
                <div className="text-center py-16">
                  <p className="text-slate-500">
                    No products match your search. Try adjusting the keywords.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="text-center mt-12">
        <Button asChild variant="outline" className="border-slate-300 bg-white">
          <Link to="/">
            <span className="font-semibold">Back to website</span>
          </Link>
        </Button>
      </div>

      <PublicFooter />
    </div>
  );
}

function ProductItem({ variant }: { variant: WebVariantForPublic }) {
  return (
    <Link
      to={`/products/${variant.slug}`}
      className="group flex flex-col justify-between rounded-xl border border-slate-200 p-5 hover:border-maroon hover:shadow-md transition-all bg-white"
    >
      {variant.image_path ? (
        <img
          src={variant.image_path}
          alt={variant.name}
          className="w-full h-28 object-cover rounded-lg"
        />
      ) : (
        <div className="h-28 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg text-slate-400">
          <span className="text-4xl">📦</span>
        </div>
      )}
      <div className="mt-4">
        <p className="text-xs text-slate-500 font-semibold">SKU: {variant.sku}</p>
        <h3 className="font-semibold text-slate-900 group-hover:text-maroon mt-1 line-clamp-2">
          {variant.name}
        </h3>
        {variant.description && (
          <p className="text-sm text-slate-500 mt-2 line-clamp-2">{variant.description}</p>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-maroon font-bold">Open product →</span>
        <ChevronRight size={16} className="text-slate-300 group-hover:text-maroon" />
      </div>
    </Link>
  );
}

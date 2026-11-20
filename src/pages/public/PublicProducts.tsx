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
 * with glassmorphism cards and modern touch-friendly design.
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary/30 selection:text-primary">
      <PublicHeader />

      <BreadcrumbNav items={[
        { label: 'Home', href: '/' },
        { label: 'Products', href: '/products' },
      ]} />

      {/* Hero */}
      <section className="py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
              Our{' '}
              <span className="bg-gradient-to-r from-primary via-indigo-600 to-pink-500 bg-clip-text text-transparent">
                Products
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Laboratory and imaging products grouped under your departments.
            </p>
            <Badge className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm border border-white/60 px-4 py-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {categories.length} departments • {variants.length} items
            </Badge>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-10 py-3 rounded-2xl border border-gray-200 focus:ring-0 focus:border-primary shadow-sm transition-all duration-200"
            />
          </div>
        </div>
      </section>

      {/* Products grouped under Laboratory / Imaging */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-3xl" />
              ))}
            </div>
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
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <span className="text-3xl">{cat.icon}</span>
                            {cat.name}
                          </h2>
                          {cat.description && (
                            <p className="text-sm text-gray-500 mt-1.5 max-w-2xl">
                              {cat.description}
                            </p>
                          )}
                        </div>
                        <Link
                          to={`/products/${cat.slug}`}
                          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 bg-primary/50 text-primary font-semibold border border-primary/20 hover:bg-primary hover:text-white transition-all duration-300"
                        >
                          View department →
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((v: WebVariantForPublic) => (
                          <ProductItem key={v.id} variant={v} />
                        ))}
                      </div>
                    </div>
                  );
                })}

              {filteredVariants.length === 0 && !loading && (
                <div className="text-center py-20 rounded-3xl bg-white/50 backdrop-blur-sm border border-white/60 shadow-sm p-12">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <Search size={32} />
                  </div>
                  <p className="text-lg text-gray-600 font-medium mb-2">
                    No products match your search
                  </p>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Try adjusting your keywords.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="text-center mt-12 sm:mt-16 mb-12 sm:mb-20">
        <Button
          asChild
          variant="outline"
          className="border-gray-200 bg-white hover:bg-primary hover:text-white rounded-2xl px-8 py-3 font-semibold shadow-sm transition-all duration-300 hover:shadow-md"
        >
          <Link to="/">
            <span className="flex items-center gap-2 font-semibold">Back to website</span>
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
      className="group flex flex-col justify-between rounded-3xl border border-gray-100 p-6 hover:border-primary/30 hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm"
    >
      <div className="h-32 flex items-center justify-center bg-gray-50 rounded-2xl mb-4 overflow-hidden">
        {variant.image_path ? (
          <img
            src={variant.image_path}
            alt={variant.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
            📦
          </div>
        )}
      </div>
      <div className="flex-1">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">
          SKU: {variant.sku}
        </p>
        <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors duration-300 mb-2 line-clamp-2">
          {variant.name}
        </h3>
        {variant.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {variant.description}
          </p>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs font-medium">
        <span className="text-primary font-bold">Open product →</span>
        <ChevronRight size={16} className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
      </div>
    </Link>
  );
}

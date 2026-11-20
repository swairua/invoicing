import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { useWebCategories, WebCategoryForPublic } from '@/hooks/useWebCategories';
import { useHeroSlides } from '@/hooks/useHeroSlides';
import { HeroSlider } from '@/components/HeroSlider';
import { useCompanyConfig } from '@/hooks/useCompanyConfig';
import { useSEO } from '@/hooks/useSEO';
import { generateOrganizationSchema } from '@/utils/seoHelpers';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Public website landing at "/" - the two-category entry point:
 * Laboratory and Imaging. Each card links to /products/:slug which
 * lists that department's items (via ProductDetail).
 *
 * All categories and items come from web_categories / web_variants,
 * read with the unauthenticated public_read endpoint - editable by the
 * admin in Web Manager.
 */
export default function PublicCategories() {
  const company = useCompanyConfig();
  const brand = company.name || 'Diag Solutions Ltd';
  const { categories, loading } = useWebCategories();
  const { slides, loading: slidesLoading } = useHeroSlides();

  useSEO(
    {
      title: `${brand} | Laboratory & Imaging Equipment`,
      description:
        'Diagnostic laboratory and imaging equipment for East African healthcare.',
      keywords: 'laboratory equipment, imaging equipment, CT scanner, X-ray, ultrasound, diagnostics',
      url: '/',
      image: company.logo_url,
    },
    generateOrganizationSchema(company)
  );

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <PublicHeader />

      {/* Hero: rotating slider once slides load, static hero otherwise */}
      {slidesLoading || slides.length === 0 ? (
        <StaticHero brand={brand} company={company} />
      ) : (
        <HeroSlider slides={slides} />
      )}

      {/* Category cards */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {loading ? (
              <>
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-64 w-full rounded-2xl" />
              </>
            ) : categories.length === 0 ? (
              <div className="col-span-1 md:col-span-2 text-center py-16 text-slate-500">
                <MapPin className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No active departments yet. The site administrator will add them soon.</p>
              </div>
            ) : (
              categories.map((category: WebCategoryForPublic) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                />
              ))
            )}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function StaticHero({
  brand,
  company,
}: {
  brand: string;
  company: ReturnType<typeof useCompanyConfig>;
}) {
  return (
    <section className="bg-gradient-to-br from-slate-50 via-neutral-100 to-neutral-50 py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight">
          <span className="text-maroon">{brand}</span>{' '}
          <span className="text-slate-500">|</span>{' '}
          Laboratory & Imaging
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
          {company.description ||
            'Trusted diagnostic equipment across East Africa. Choose a department below to explore its complete range.'}
        </p>
      </div>
    </section>
  );
}

function CategoryCard({ category }: { category: WebCategoryForPublic }) {
  const icon = category.icon || '🏥';
  const image = category.image_path;
  return (
    <Link
      to={`/products/${category.slug}`}
      className="group relative flex flex-col justify-end h-64 w-full rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-slate-200"
    >
      {image ? (
        <img
          src={image}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
          <span className="text-5xl opacity-70">{icon}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex flex-col justify-end p-6 sm:p-8">
        <span className="text-4xl sm:text-5xl">{icon}</span>
        <h3 className="text-2xl sm:text-3xl font-bold text-white mt-2 group-hover:text-maroon transition-colors">
          {category.name}
        </h3>
        {category.description && (
          <p className="text-sm sm:text-base text-slate-300 mt-1 max-w-lg">
            {category.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-4 text-sm font-medium">
          <span className="text-white">View details</span>
          <ArrowRight size={16} className="text-white transition-transform group-hover:translate-x-1" />
          {category.variant_count != null && (
            <span className="ml-2 text-slate-400">{category.variant_count} items</span>
          )}
        </div>
      </div>
    </Link>
  );
}

import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Sparkles, Wand2, Microscope, LayoutList, Play, ArrowUpRight, Tablet, Droplets, ShieldCheck, Users } from 'lucide-react';
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
 * Public website landing at "/" - Laboratory & Imaging entry point.
 * Glassmorphism cards, modern touch-friendly design.
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

  const featureCards = [
    {
      icon: <Sparkles className="w-7 h-7" />,
      title: 'Laboratory Supplies',
      desc: 'Reagents, consumables and diagnostics for modern labs.',
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      to: '/products',
    },
    {
      icon: <LayoutList className="w-7 h-7" />,
      title: 'Imaging Equipment',
      desc: 'CT Scan, X-Ray, ultrasound and diagnostic imaging.',
      color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      to: '/products',
    },
    {
      icon: <Microscope className="w-7 h-7" />,
      title: 'Research Grade',
      desc: 'Precision instruments for research and academia.',
      color: 'bg-green-500/10 text-green-600 border-green-500/20',
      to: '/products',
    },
    {
      icon: <Wand2 className="w-7 h-7" />,
      title: 'Fast Delivery',
      desc: 'Reliable logistics across East Africa.',
      color: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      to: '/contact',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary/30 selection:text-primary">
      <PublicHeader currentPage="home" />

      {/* Hero Section */}
      {slidesLoading || slides.length === 0 ? (
        <StaticHero brand={brand} company={company} />
      ) : (
        <HeroSlider slides={slides} />
      )}

      {/* Feature Strip */}
      <section className="py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {featureCards.map((card, i) => (
              <Link
                key={i}
                to={card.to}
                className="group relative rounded-3xl p-8 sm:p-10 bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                  {card.icon}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors duration-300">
                  {card.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {card.desc}
                </p>
                <div className="mt-6 flex items-center gap-2 text-primary font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Explore
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Category cards - Laboratory & Imaging */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10 sm:mb-16">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
                Explore Our{' '}
                <span className="bg-gradient-to-r from-primary via-indigo-600 to-pink-500 bg-clip-text text-transparent">
                  Departments
                </span>
              </h2>
              <p className="text-lg text-gray-600 max-w-xl">
                Laboratory and imaging products grouped under your departments.
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 bg-primary text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 bg-gradient-to-r from-primary via-indigo-600 to-purple-600"
            >
              View All Departments
              <ArrowUpRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {loading ? (
              <>
                <Skeleton className="h-80 w-full rounded-3xl" />
                <Skeleton className="h-80 w-full rounded-3xl" />
              </>
            ) : categories.length === 0 ? (
              <div className="col-span-2 rounded-3xl p-16 text-center bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30 text-gray-400" />
                <p className="text-gray-500">No active departments yet.</p>
              </div>
            ) : (
              categories.map((category: WebCategoryForPublic) => (
                <CategoryCard key={category.id} category={category} />
              ))
            )}
          </div>
        </div>
      </section>

      <div className="py-16 sm:py-20 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">
            Trusted Across East Africa
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-10">
            Supplying laboratory reagents, instrumentation and diagnostic equipment
            to hospitals, universities, research and industrial clients.
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <span className="text-2xl font-bold text-gray-700">30+</span>
            <span className="text-2xl font-bold text-gray-700">500+</span>
            <span className="text-2xl font-bold text-gray-700">15000+</span>
            <span className="text-2xl font-bold text-gray-700">10+</span>
          </div>
          <div className="mt-10 flex justify-center gap-3 text-gray-400 text-xs tracking-widest">
            <span>Hospitals</span>
            <span>Clinics</span>
            <span>Labs</span>
            <span>Universities</span>
          </div>
        </div>
      </div>

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
    <section className="relative pt-20 sm:pt-24 pb-16 sm:pb-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 via-purple-500/20 to-transparent -z-10" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 sm:gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/60 text-primary font-bold text-sm shadow-sm">
              <Sparkles size={16} /> New Collection 2026
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
              <span className="block">Advanced {brand}</span>{' '}
              <span className="block bg-gradient-to-r from-primary via-indigo-600 to-pink-500 bg-clip-text text-transparent">
                Laboratory & Imaging
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-lg leading-relaxed">
              {company.description ||
                'Trusted diagnostic equipment across East Africa. Choose a department below to explore its complete range.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                to="/products"
                className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-primary via-indigo-600 to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10">Browse Departments</span>
                <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-all duration-300" />
              </Link>
              <Link
                to="/about-us"
                className="group px-8 py-4 rounded-2xl bg-white/90 backdrop-blur-sm border border-white/70 text-primary font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 hover:bg-white"
              >
                Learn More
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative rounded-[2rem] p-[8px] bg-gradient-to-r from-blue-500 to-purple-500 shadow-2xl">
              <div className="relative rounded-[1.8rem] bg-white/90 backdrop-blur-md p-8 sm:p-12 shadow-inner overflow-hidden">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                        <Microscope size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Laboratory</p>
                        <p className="text-lg font-bold text-gray-900">Reagents & Consumables</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-purple-50 border border-purple-100">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                        <LayoutList size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Imaging</p>
                        <p className="text-lg font-bold text-gray-900">CT • X-Ray • Ultrasound</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 border border-green-100">
                      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                        <Wand2 size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Research</p>
                        <p className="text-lg font-bold text-gray-900">Instruments</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-orange-50 border border-orange-100">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                        <Play size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Delivery</p>
                        <p className="text-lg font-bold text-gray-900">East Africa Wide</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ category }: { category: WebCategoryForPublic }) {
  const categoryIconMap: Record<string, React.ReactNode> = {
    'laboratory': <Microscope className="w-7 h-7" />,
    'imaging': <Tablet className="w-7 h-7" />,
    'infection-control': <ShieldCheck className="w-7 h-7" />,
    'hospital-equipments': <Tablet className="w-7 h-7" />,
    'hospital-instruments': <Wand2 className="w-7 h-7" />,
    'hospital-furniture': <Users className="w-7 h-7" />,
    'hospital-linen': <Droplets className="w-7 h-7" />,
    'ppe': <ShieldCheck className="w-7 h-7" />,
    'others': <LayoutList className="w-7 h-7" />,
  };
  const icon = categoryIconMap[category.slug] || <LayoutList className="w-7 h-7" />;
  const image = category.image_path;
  return (
    <Link
      to={`/products/${category.slug}`}
      className="group relative rounded-3xl overflow-hidden bg-white/70 backdrop-blur-sm border border-white/60 shadow-lg hover:shadow-2xl transition-all duration-500"
    >
        <div className="relative h-64 sm:h-80 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={category.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-5xl opacity-40">{icon}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent p-6 sm:p-8 flex flex-col justify-end">
          {!image && (
            <span className="text-4xl sm:text-5xl mb-2 opacity-80">{icon}</span>
          )}
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1 group-hover:text-primary/20 transition-colors duration-300">
            {category.name}
          </h3>
          {category.description && (
            <p className="text-sm sm:text-base text-gray-200/90 mt-1 max-w-lg line-clamp-2">
              {category.description}
            </p>
          )}
          <div className="mt-4 flex items-center gap-2 text-primary/90 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Browse
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
        <div className="absolute top-4 left-4 z-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-sm font-semibold text-gray-700 shadow-sm border border-white/60">
          {category.variant_count != null && (
            <span className="text-pink-600">{category.variant_count} items</span>
          )}
        </div>
      </div>
    </Link>
  );
}

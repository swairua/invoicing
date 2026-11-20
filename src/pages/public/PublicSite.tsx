import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompanyConfig } from '@/hooks/useCompanyConfig';
import { useSEO } from '@/hooks/useSEO';
import { generateOrganizationSchema } from '@/utils/seoHelpers';
import { usePublicStats, usePublicRecentInvoiced } from '@/hooks/usePublicSiteData';
import { PublicHeader } from '@/components/public/PublicHeader';
import { IntroStrip, StatsBand, HeroSection } from './HeroSection';
import { CategoriesSection, BrandsSection } from './CategoriesSection';
import { RecentlyInvoiced, ProductPreview } from './FeaturedSection';
import { AboutSection, ValuesSection, VisionMissionSection, WhyHaemoneticsSection } from './AboutSection';
import { TeamSection, ClientsStrip } from './TeamSection';
import { PublicFooter } from '@/components/PublicFooter';

export default function PublicSite() {
  const company = useCompanyConfig();
  const { data: stats, isLoading: statsLoading } = usePublicStats();
  const { data: recentInvoiced = [], isLoading: recentLoading } =
    usePublicRecentInvoiced(8);

  useSEO(
    {
      title: `${company.name || 'Haemonetics East Africa Limited'} | Medical, Laboratory & Diagnostic Supplies in Kenya`,
      description:
        company.description ||
        'Haemonetics East Africa Limited supplies laboratory reagents, instrumentation and diagnostic equipment to hospitals, universities, research and industrial clients across East Africa.',
      keywords:
        'medical supplies, laboratory equipment, reagents, diagnostics, Kenya, East Africa, Haemonetics',
      url: '/',
      image: company.logo_url,
    },
    generateOrganizationSchema(company)
  );

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <PublicHeader />

      {/* Hero */}
      <HeroSection stats={stats} />
      <StatsBand stats={stats} />
      <IntroStrip />

      <CategoriesSection />
      <BrandsSection />

      {/* Real data: recently invoiced + product preview */}
      <RecentlyInvoiced items={recentInvoiced} loading={recentLoading} />
      <ProductPreview />

      {/* About / Vision & Mission / Values / Why / Clients / Team */}
      <AboutSection />
      <VisionMissionSection />
      <ValuesSection />
      <WhyHaemoneticsSection />
      <ClientsStrip />
      <TeamSection />

      {/* Contact */}
      <section id="contact" className="py-16 sm:py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold">Get in touch</h2>
            <p className="text-slate-300 mt-4">
              Ready to discuss your laboratory supply needs? Contact our team
              and we'll help you find the right solution.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <Phone className="h-6 w-6 text-maroon" />
              <div>
                <p className="font-semibold text-white">Phone</p>
                <p className="text-slate-300">{company.phone || '+254 207 863 782'}</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Mail className="h-6 w-6 text-maroon" />
              <div>
                <p className="font-semibold text-white">Email</p>
                <p className="text-slate-300">{company.email || 'sales@heal.co.ke'}</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <MapPin className="h-6 w-6 text-maroon" />
              <div>
                <p className="font-semibold text-white">Address</p>
                <p className="text-slate-300">
                  {company.address || 'Naivasha Road, Kamrose Plaza, 1st Flr, Rm 14'}
                  {company.city && `, ${company.city}`}
                  {company.country && ` (${company.country})`}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Button
              asChild
              size="lg"
              className="bg-maroon hover:bg-maroon/dark text-white"
            >
              <a href={`mailto:${company.email || 'sales@heal.co.ke'}`}>Request a quote</a>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

import { Link } from 'react-router-dom';
import { ChevronRight, Factory } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCompanyConfig } from '@/hooks/useCompanyConfig';
import { PublicStats } from '@/hooks/usePublicSiteData';
import { Stat, SectionBadge } from './Stat';

export function HeroSection({ stats }: { stats: PublicStats | undefined }) {
  const company = useCompanyConfig();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-neutral-100 to-neutral-50">
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-neutral-300 to-neutral-200 blur-3xl opacity-50" />
      <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 blur-3xl opacity-50" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6">
            <Badge variant="secondary" className="text-xs font-semibold">
              Est. 2013 • Serving East Africa
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              {company.name || 'Haemonetics East Africa Limited'}
            </h1>
            <p className="text-lg text-slate-600">
              {company.description ||
                'Your trusted partner for laboratory reagents, instrumentation and diagnostic supplies across Kenya and the wider East African region.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                size="lg"
                className="bg-maroon hover:bg-maroon/dark text-white"
              >
                <Link to="/products">
                  Explore products <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-slate-300">
                <a href="#contact">Talk to us</a>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-white/70 rounded-2xl p-6 shadow-lg border border-white/60">
              <Factory className="h-7 w-7 text-maroon mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">
                {stats?.products ?? '-'}
              </p>
              <p className="text-sm text-slate-500">Products in stock</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function StatsBand({ stats }: { stats: PublicStats | undefined }) {
  return (
    <section className="py-8 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Stat number={stats?.products} label="Products stocked" />
      </div>
    </section>
  );
}

export function IntroStrip() {
  const company = useCompanyConfig();
  return (
    <section className="py-12 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionBadge>Who we are</SectionBadge>
        <p className="mt-3 max-w-4xl text-slate-600">
          {company.description ||
            `${company.name || 'Haemonetics East Africa Limited'} operates in the Medical, Research,
            Production, Food and Beverage and QC sectors. Founded in Kenya in
            2013, we are essentially a supplier of laboratory reagents and
            instrumentation to research institutes, hospitals, universities,
            technological institutes, veterinary practices, industrial and
            pharmaceutical companies throughout East Africa.`}
        </p>
      </div>
    </section>
  );
}

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, MapPin, Phone, Globe, Target, Eye, Award, Handshake, CheckCircle2, Sparkles } from 'lucide-react';
import { useCompanyConfig } from '@/hooks/useCompanyConfig';
import { VALUES, VISION, MISSION, EXPERTISE, SERVICES_TO_PARTNERS, CUSTOMER_BENEFITS } from './public-site-data';
import { SectionBadge } from './Stat';

interface ValueCardProps {
  icon: string;
  label: string;
  desc: string;
}

function valueIcon(icon: string) {
  switch (icon) {
    case 'shield':
      return '🛡️';
    case 'sparkles':
      return '💡';
    case 'heart':
      return '🤝';
    case 'users':
      return '👥';
    case 'megaphone':
      return '📢';
    case 'leaf':
      return '🌍';
    default:
      return '•';
  }
}

export function AboutSection() {
  const company = useCompanyConfig();
  const brand = company.name || 'Diag Solutions Ltd';

  return (
    <section id="about" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
<div className="space-y-6">
              <SectionBadge>About us</SectionBadge>
              <h2 className="text-3xl font-bold text-slate-900">
                {brand}
              </h2>
              <div className="space-y-4 text-slate-600">
                <p>
                  <strong className="text-slate-800">Founded 2013</strong> in
                  Kenya, {brand} operates in the Medical, Research, Production,
                  Food &amp; Beverage, and QC Sectors — a supplier of laboratory
                  reagents and instrumentation to research institutes,
                  hospitals, universities, technological institutes, veterinary
                  practices, industrial and pharmaceutical companies throughout
                  East Africa.
                </p>
                <p>
                  Our professional expertise enables us to provide quality advice
                  and guidance, which effectively controls cost, eliminates waste
                  and maximizes efficiency. We believe products should be
                  augmented by first-class support material — an integral part of
                  the laboratory supply business today.
                </p>
                <p>
                  {brand}'s policy is simply to be <em>"Brilliant by Design"</em> —
                  to be the automatic supplier of first choice by providing the
                  best products and a personal service.
                </p>
              </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-maroon mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Region</p>
                  <p className="text-slate-600">Kenya & wider East Africa</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="secondary" className="mt-0.5">
                  {company.primary_color || 'Medical & Lab'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="border border-slate-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-maroon" />
                  Registered address
                </h3>
                <address className="not-italic text-slate-600 space-y-1">
                  <p>{company.address || 'Naivasha Road, Kamrose Plaza, 1st Flr, Rm 14'}</p>
                  <p>
                    P.O. Box 61214-00200, {company.city || 'Nairobi'}, {company.country || 'Kenya'}
                  </p>
                </address>
              </CardContent>
            </Card>
            <Card className="border border-slate-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-maroon" />
                  Contact details
                </h3>
                <div className="space-y-2 text-slate-600">
                  <p className="flex items-center gap-2">
                    <span>Tel:</span> {company.phone || '+254 180 274401'}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {company.email || 'info@diagsolutionsltd.com'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ValuesSection() {
  return (
    <section className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <SectionBadge>Our values</SectionBadge>
          <h2 className="text-3xl font-bold text-slate-900 mt-2">
            Values &amp; strengths
          </h2>
          <p className="text-slate-600 mt-4">
            Haemonetics is committed to strong leadership to achieve excellence,
            accountability and compliance based on our values.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {VALUES.map((v) => (
            <Card
              key={v.label}
              className="border border-slate-200 bg-white hover:shadow-sm transition-shadow"
            >
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-3">{valueIcon(v.icon)}</div>
                <h3 className="font-bold text-slate-900 mb-2">{v.label}</h3>
                <p className="text-sm text-slate-600">{v.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function VisionMissionSection() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <SectionBadge>Our vision &amp; mission</SectionBadge>
          <h2 className="text-3xl font-bold text-slate-900 mt-2">
            Brilliant by Design
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border border-slate-200">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-lg bg-maroon/10 flex items-center justify-center flex-shrink-0">
                  <Eye className="h-6 w-6 text-maroon" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Our Vision</h3>
              </div>
              <ul className="space-y-3 text-slate-600">
                {VISION.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-maroon flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border border-slate-200">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-lg bg-maroon/10 flex items-center justify-center flex-shrink-0">
                  <Target className="h-6 w-6 text-maroon" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Our Mission</h3>
              </div>
              <p className="text-slate-600 leading-relaxed">{MISSION}</p>

              <div className="flex items-center gap-3 mt-8 mb-3">
                <div className="h-11 w-11 rounded-lg bg-maroon/10 flex items-center justify-center flex-shrink-0">
                  <Award className="h-6 w-6 text-maroon" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Our Expertise</h3>
              </div>
              <p className="text-slate-600 leading-relaxed">{EXPERTISE}</p>

              <div className="flex items-center gap-3 mt-8 mb-3">
                <div className="h-11 w-11 rounded-lg bg-maroon/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-6 w-6 text-maroon" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Values &amp; strengths</h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Our people have a strong desire to do the "right thing" and to
                deliver the promises that we make. We maintain very high levels of
                innovation, knowledge &amp; technical expertise to deliver
                integrated solutions that work. We aim to build on the traditional
                values of trustworthiness and to build strong partnerships with
                our customers and strategic partners.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function WhyCard({ data }: { data: typeof SERVICES_TO_PARTNERS }) {
  return (
    <Card className="border border-slate-200 h-full">
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-11 w-11 rounded-lg bg-maroon/10 flex items-center justify-center flex-shrink-0">
            <Handshake className="h-6 w-6 text-maroon" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{data.heading}</h3>
        </div>
        <p className="text-slate-600 leading-relaxed mb-5">{data.intro}</p>
        <ul className="space-y-3">
          {data.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-slate-600">
              <CheckCircle2 className="h-5 w-5 text-maroon flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function WhyHaemoneticsSection() {
  return (
    <section className="py-16 sm:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <SectionBadge>Why Haemonetics</SectionBadge>
          <h2 className="text-3xl font-bold text-slate-900 mt-2">
            Why partner with us
          </h2>
          <p className="text-slate-600 mt-4">
            We are proud to be on solid financial standing, have a positive credit
            history and an unmatched payable record. Our distribution network is
            secure, professional and thoroughly vetted.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <WhyCard data={SERVICES_TO_PARTNERS} />
          <WhyCard data={CUSTOMER_BENEFITS} />
        </div>
      </div>
    </section>
  );
}

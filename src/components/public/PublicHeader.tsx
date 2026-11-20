import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompanyConfig } from '@/hooks/useCompanyConfig';

// Nav routes for the public website (home = "/" = PublicCategories).
// "Why Haemonetics" was removed — the public header no longer links to the
// dormant landing-page anchors ("#why", "#team"); pages are fully routed now.
const NAV = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about-us' },
  { label: 'Products', href: '/products' },
  { label: 'Contact', href: '/contact' },
];

export function PublicHeader() {
  const company = useCompanyConfig();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="h-16 w-auto sm:h-20 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
                <div className="h-16 w-16 sm:h-20 rounded-xl bg-gradient-to-br from-maroon to-neutral-700 flex items-center justify-center text-white font-bold text-xl">
                H
              </div>
            )}
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {company.name || 'Haemonetics East Africa Limited'}
            </span>
          </Link>

         <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-slate-700 hover:text-maroon-dark transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>

      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block px-3 py-2 text-base font-medium text-slate-700 hover:text-maroon-dark hover:bg-slate-50 rounded-md"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown, Bandage, Package, Pipette, Wind, Baby, Hand, Monitor, Sofa, Wrench, Shirt, Shield, MoreHorizontal, Droplet, Syringe, AlertCircle } from 'lucide-react';
import { BiolegendLogo } from '@/components/ui/biolegend-logo';
import { getProductBySlug } from '@/data/products';

interface PublicHeaderProps {
  currentPage?: string;
}

export function PublicHeader({ currentPage }: PublicHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);

  const productIconMap: { [key: string]: React.ReactNode } = {
    'Bandages, Tapes and Dressings': <Bandage size={24} className="text-red-500" />,
    'Bottles and Containers': <Package size={24} className="text-orange-600" />,
    'Catheters and Tubes': <Pipette size={24} className="text-amber-600" />,
    'Cotton Wool': <Wind size={24} className="text-gray-500" />,
    'Diapers and Sanitary': <Baby size={24} className="text-pink-500" />,
    'Gloves': <Hand size={24} className="text-yellow-600" />,
    'Hospital Equipments': <Monitor size={24} className="text-indigo-600" />,
    'Hospital Furniture': <Sofa size={24} className="text-amber-600" />,
    'Hospital Instruments': <Wrench size={24} className="text-orange-600" />,
    'Hospital Linen': <Shirt size={24} className="text-cyan-600" />,
    'Infection Control': <Shield size={24} className="text-green-600" />,
    'Others': <MoreHorizontal size={24} className="text-slate-600" />,
    'PPE': <AlertCircle size={24} className="text-rose-600" />,
    'Spirits, Detergents and Disinfectants': <Droplet size={24} className="text-teal-600" />,
    'Syringes and Needles': <Syringe size={24} className="text-lime-600" />,
  };

  const fullProductSubmenu = [
    'Bandages, Tapes and Dressings',
    'Bottles and Containers',
    'Catheters and Tubes',
    'Cotton Wool',
    'Diapers and Sanitary',
    'Gloves',
    'Hospital Equipments',
    'Hospital Furniture',
    'Hospital Instruments',
    'Hospital Linen',
    'Infection Control',
    'Others',
    'PPE',
    'Spirits, Detergents and Disinfectants',
    'Syringes and Needles',
  ];

  const navigationItems = [
    { label: 'Home', href: '/' },
    { label: 'About Us', href: '/about-us' },
    {
      label: 'Our Products',
      href: '/products',
      submenu: currentPage === 'about' ? undefined : fullProductSubmenu,
    },
    { label: 'Talk to us', href: '/contact' },
  ];

  const isCurrentPage = (page: string) => currentPage === page;

  return (
    <header className="sticky top-0 z-50 border-b border-white/30 bg-white/60 backdrop-blur-md bg-gradient-to-b from-white/70 via-white/50 to-transparent shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 sm:h-20 gap-8 relative z-20">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 group">
            <BiolegendLogo size="lg" showText={true} />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 ml-auto">
            {navigationItems.map((item) => {
              if (item.label === 'Talk to us') {
                return (
                  <Link
                    key={item.label}
                    to="/contact"
                    className={`transition-all duration-300 font-semibold px-5 py-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-white/50 ${
                      isCurrentPage('contact')
                        ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.35)]'
                        : 'text-gray-700 hover:text-primary hover:bg-gray-50 hover:shadow-md'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              }
              if (item.label === 'About Us') {
                return (
                  <Link
                    key={item.label}
                    to="/about-us"
                    className={`transition-all duration-300 font-semibold px-5 py-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-white/50 ${
                      isCurrentPage('about')
                        ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.35)]'
                        : 'text-gray-700 hover:text-primary hover:bg-gray-50 hover:shadow-md'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              }
              if (item.label === 'Home') {
                return (
                  <Link
                    key={item.label}
                    to="/"
                    className={`transition-all duration-300 font-semibold px-5 py-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-white/50 ${
                      isCurrentPage('home')
                        ? 'bg-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.35)]'
                        : 'text-gray-700 hover:text-primary hover:bg-gray-50 hover:shadow-md'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <div key={item.label} className="relative group">
                  <a
                    href={item.href}
                    className={`transition-all duration-300 flex items-center gap-1.5 font-semibold px-5 py-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-white/50 text-gray-700 hover:text-primary hover:bg-gray-50 hover:shadow-md`}
                  >
                    {item.label}
                    {item.submenu && <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />}
                  </a>
                  {item.submenu && (
                    <div className="absolute right-0 mt-2 w-[720px] rounded-2xl bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 before:absolute before:-top-1 before:left-1/2 before:-translate-x-1/2 before:w-8 before:h-8 before:bg-white/95 before:border-t-2 before:border-l-2 before:border-white/60 before:rotate-45">
                      <div className="grid grid-cols-5 gap-x-6 gap-y-6 p-8">
                        {item.submenu.map((sub) => {
                          const product = getProductBySlug(sub.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
                          const productSlug = product?.slug || sub.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                          return (
                            <Link
                              key={sub}
                              to={`/products/${productSlug}`}
                              className="flex flex-col items-center text-center group/item transition-all duration-300 hover:scale-105"
                            >
                              <div className="w-10 h-10 mb-2.5 rounded-xl bg-gray-50 flex items-center justify-center transition-all duration-300 group-hover/item:scale-110 group-hover/item:bg-primary/10">
                                {productIconMap[sub]}
                              </div>
                              <span className="text-xs font-medium text-gray-600 group-hover/item:text-primary group-hover/item:font-bold transition-colors leading-tight whitespace-nowrap">
                                {sub}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden ml-auto w-10 h-10 rounded-xl bg-white/80 backdrop-blur-sm border border-white/60 flex items-center justify-center hover:bg-gray-100 transition-all duration-200"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden rounded-2xl bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl mt-2">
            <div className="p-4 space-y-2">
              {navigationItems.map((item) => {
                if (item.label === 'Talk to us') {
                  return (
                    <Link
                      key={item.label}
                      to="/contact"
                      className="w-full text-left px-5 py-3 text-gray-700 hover:bg-primary/50 hover:text-primary rounded-xl font-medium transition-all duration-200"
                    >
                      {item.label}
                    </Link>
                  );
                }
                if (item.label === 'About Us') {
                  return (
                    <Link
                      key={item.label}
                      to="/about-us"
                      className="w-full text-left px-5 py-3 text-gray-700 hover:bg-primary/50 hover:text-primary rounded-xl font-medium transition-all duration-200"
                    >
                      {item.label}
                    </Link>
                  );
                }
                if (item.label === 'Home') {
                  return (
                    <Link
                      key={item.label}
                      to="/"
                      className="w-full text-left px-5 py-3 text-gray-700 hover:bg-primary/50 hover:text-primary rounded-xl font-medium transition-all duration-200"
                    >
                      {item.label}
                    </Link>
                  );
                }
                return item.submenu ? (
                  <>
                    <button
                      key={item.label}
                      onClick={() => item.submenu && setProductsDropdownOpen(!productsDropdownOpen)}
                      className="w-full text-left px-5 py-3 text-gray-700 hover:bg-primary/50 hover:text-primary rounded-xl font-medium flex justify-between items-center transition-all duration-200"
                    >
                      {item.label}
                      {item.submenu && (
                        <ChevronDown
                          size={14}
                          className={`transition-transform ${productsDropdownOpen ? 'rotate-180' : ''} text-gray-500`}
                        />
                      )}
                    </button>
                    {item.submenu && productsDropdownOpen && (
                      <div className="bg-gray-50/50 rounded-xl p-3 space-y-1.5">
                        {item.submenu.map((sub) => {
                          const product = getProductBySlug(sub.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
                          const productSlug = product?.slug || sub.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                          return (
                            <Link
                              key={sub}
                              to={`/products/${productSlug}`}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-white hover:text-primary rounded-lg transition-colors duration-200"
                            >
                              {sub}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="w-full text-left px-5 py-3 text-gray-700 hover:bg-primary/50 hover:text-primary rounded-xl font-medium transition-all duration-200"
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

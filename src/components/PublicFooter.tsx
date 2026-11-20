import { Link } from 'react-router-dom';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { getProductBySlug } from '@/data/products';
import { useCompanyConfig } from '@/hooks/useCompanyConfig';

interface ProductCategory {
  name?: string;
  icon?: string;
  description?: string;
  slug?: string;
}

interface PublicFooterProps {
  productCategories?: (ProductCategory | string)[];
}

export const PublicFooter = ({ productCategories = [] }: PublicFooterProps) => {
  const company = useCompanyConfig();
  const getCategoryName = (category: ProductCategory | string): string => {
    return typeof category === 'string' ? category : category.name || '';
  };

  const getProductSlug = (category: string) => {
    const product = getProductBySlug(category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    return product?.slug || category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  return (
    <footer className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black -z-10" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {productCategories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-10 sm:mb-14 border-b border-white/10 pb-8 sm:pb-12">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" /> Products
              </h3>
              <ul className="text-gray-400 space-y-2 sm:space-y-3 text-sm">
                {productCategories.slice(0, 5).map((cat) => {
                  const catName = getCategoryName(cat);
                  return (
                    <li key={catName}>
                      <Link
                        to={`/products/${getProductSlug(catName)}`}
                        className="hover:text-white hover:pl-1 transition-all duration-300 inline-block py-1"
                      >
                        {catName}
                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-1" />
                      </Link>
                    </li>
                  );
                })}
                <li className="pt-2">
                  <Link
                    to="/products"
                    className="text-primary hover:text-pink-400 font-semibold transition-colors duration-300 py-1 flex items-center gap-1"
                  >
                    View All Departments <ArrowRight size={16} className="transition-transform duration-300" />
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" /> Contact Us
              </h3>
              <div className="text-gray-400 space-y-4 sm:space-y-5 text-sm not-italic">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center text-green-400 mt-0.5">
                    <MessageCircle size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{company.name}</p>
                    {company.address && <p>{company.address}</p>}
                    {(company.city || company.state || company.postal_code || company.country) && (
                      <p className="text-xs">
                        {[company.city, company.state, company.postal_code, company.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                {company.phone && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center text-green-400 mt-0.5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 011 1v5a1 1 0 01-1 1H5a2 2 0 01-2-2zm10 0H5a2 2 0 012-2h14a2 2 0 012 2m0 0H5a2 2 0 012-2h14a2 2 0 012 2m0 0v3a1 1 0 01-1 1H5a2 2 0 01-2-2z" /></svg>
                    </div>
                    <div>
                      <p className="font-semibold text-white mb-1">Phone</p>
                      <a href={`tel:${company.phone}`} className="text-primary hover:text-green-400 transition-colors py-1 block" aria-label={`Call us at ${company.phone}`}>
                        {company.phone}
                      </a>
                    </div>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center text-green-400 mt-0.5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-5.5 6.6L3 8m16 0l-5.5 8.25a2 2 0 01-2.22 0L5 8m0 0a2 2 0 002.22 2h11.56a2 2 0 002.22-2z" /></svg>
                    </div>
                    <div>
                      <p className="font-semibold text-white mb-1">Email</p>
                      <p>
                        <a href={`mailto:${company.email}`} className="text-primary hover:text-green-400 transition-colors py-1 block" aria-label={`Email us at ${company.email}`}>
                          {company.email}
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-pink-400" /> Quick Links
              </h3>
              <ul className="text-gray-400 space-y-2 sm:space-y-3 text-sm">
                <li>
                  <Link
                    to="/about-us"
                    className="hover:text-white hover:pl-1 transition-all duration-300 inline-block py-1"
                  >
                    About Us
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-1" />
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-white hover:pl-1 transition-all duration-300 inline-block py-1"
                  >
                    Contact Us
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-1" />
                  </Link>
                </li>
                <li>
                  <Link
                    to="/products"
                    className="hover:text-white hover:pl-1 transition-all duration-300 inline-block py-1"
                  >
                    Our Products
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-1" />
                  </Link>
                </li>
                {company.website && (
                  <li>
                    <a
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white hover:pl-1 transition-all duration-300 inline-block py-1"
                    >
                      Visit Website
                      <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-1" />
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        <div className="pt-8 sm:pt-10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-white/10 pt-6 sm:pt-8">
            <p className="text-gray-500 text-xs sm:text-sm">
              © {new Date().getFullYear()} {company.name}. All rights reserved.
            </p>
            <div className="flex gap-6 sm:gap-8">
              <a href="https://www.facebook.com/medplusafrica" className="text-gray-500 hover:text-white transition-colors duration-300 p-2 rounded-lg hover:bg-gray-800" aria-label="Visit us on Facebook">
                <span className="sr-only">Facebook</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/medplusafrica" className="text-gray-500 hover:text-white transition-colors duration-300 p-2 rounded-lg hover:bg-gray-800" aria-label="Visit us on Instagram">
                <span className="sr-only">Instagram</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.466.182-.8.398-1.15.748-.35.35-.566.684-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.398.8.748 1.15.35.35.684.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.684.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

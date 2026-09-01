import { useEffect } from 'react';
import { 
  updateMetaTags, 
  addStructuredData, 
  generateWebPageSchema,
  generateProductSchema,
  SEOMetadata 
} from '@/utils/seoHelpers';
import { useCompanyConfig } from '@/contexts/CompanyConfigContext';

/**
 * Hook to manage SEO for a page
 * Updates meta tags, og tags, and structured data
 */
export const useSEO = (metadata: SEOMetadata, structuredData?: any) => {
  const companyConfig = useCompanyConfig();

  useEffect(() => {
    // Update all meta tags
    updateMetaTags(metadata, companyConfig);

    // Add structured data
    if (structuredData) {
      addStructuredData(structuredData);
    } else {
      // Default to WebPage schema if none provided
      addStructuredData(generateWebPageSchema(metadata, companyConfig));
    }

    // Scroll to top
    window.scrollTo(0, 0);
  }, [metadata, structuredData, companyConfig]);
};

/**
 * Hook specifically for product pages
 */
export const useProductSEO = (product: {
  name: string;
  description: string;
  image?: string;
  url?: string;
  category?: string;
}) => {
  const companyConfig = useCompanyConfig();
  const metadata: SEOMetadata = {
    title: product.name,
    description: product.description,
    image: product.image,
    url: product.url,
    type: 'product',
    keywords: `${product.name}, medical supplies, ${product.category || 'healthcare products'}`,
  };

  useSEO(metadata, generateProductSchema(product, companyConfig));
};

export interface CompanyRecord {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  website?: string | null;
  description?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  currency?: string | null;
  registration_number?: string | null;
  tax_number?: string | null;
  fiscal_year_start?: number | null;
  pdf_template?: string | null;
  pdf_footer_line1?: string | null;
  pdf_footer_line2?: string | null;
  pdf_footer_enabled_docs?: string[] | string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
  is_active?: boolean | null;
}

export type CompanyBranding = Pick<
  CompanyRecord,
  | 'name'
  | 'email'
  | 'phone'
  | 'address'
  | 'city'
  | 'state'
  | 'postal_code'
  | 'country'
  | 'website'
  | 'description'
  | 'logo_url'
  | 'primary_color'
  | 'currency'
  | 'registration_number'
  | 'tax_number'
  | 'facebook_url'
  | 'instagram_url'
  | 'linkedin_url'
  | 'twitter_url'
> & { id?: string };

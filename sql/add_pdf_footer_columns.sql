-- Migration to add PDF footer columns to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pdf_footer_line1 TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pdf_footer_line2 TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pdf_footer_enabled_docs JSONB DEFAULT '[]'::JSONB;

-- Comment for clarity
COMMENT ON COLUMN companies.pdf_footer_line1 IS 'First line of the PDF footer (e.g. Mail and Tel)';
COMMENT ON COLUMN companies.pdf_footer_line2 IS 'Second line of the PDF footer (e.g. Address)';
COMMENT ON COLUMN companies.pdf_footer_enabled_docs IS 'List of document types where the custom footer is enabled';

import { getDatabase } from '@/integrations/database';

export const ADD_PDF_FOOTER_COLUMNS_SQL = `
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pdf_footer_line1 TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pdf_footer_line2 TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pdf_footer_enabled_docs JSONB DEFAULT '[]'::JSONB;
`;

export async function addPdfFooterColumns() {
  const db = getDatabase();
  try {
    // If db.raw is supported by the backend
    const result = await db.raw(ADD_PDF_FOOTER_COLUMNS_SQL);
    if (result.error) {
      return {
        success: false,
        message: result.error.message || 'Failed to add PDF footer columns'
      };
    }
    return {
      success: true,
      message: 'PDF footer columns added successfully!'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to add PDF footer columns'
    };
  }
}

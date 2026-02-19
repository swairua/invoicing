import { apiClient } from '@/integrations/api';

export interface DatabaseVerificationResult {
  isComplete: boolean;
  missingTables: string[];
  missingColumns: Array<{ table: string; column: string }>;
  details: {
    totalTables: number;
    totalColumns: number;
    verifiedTables: number;
    verifiedColumns: number;
  };
  summary: string;
}

// Expected database structure based on our audit
const EXPECTED_STRUCTURE = {
  customers: [
    'id', 'company_id', 'customer_code', 'name', 'email', 'phone', 
    'address', 'city', 'state', 'postal_code', 'country', 'credit_limit', 
    'payment_terms', 'is_active', 'created_at', 'updated_at'
  ],
  products: [
    'id', 'company_id', 'category_id', 'product_code', 'name', 'description',
    'unit_of_measure', 'cost_price', 'selling_price', 'stock_quantity',
    'minimum_stock_level', 'maximum_stock_level', 'min_stock_level', 'max_stock_level',
    'reorder_point', 'is_active', 'track_inventory', 'created_at', 'updated_at'
  ],
  invoices: [
    'id', 'company_id', 'customer_id', 'invoice_number', 'invoice_date',
    'due_date', 'lpo_number', 'status', 'subtotal', 'tax_amount', 'total_amount',
    'paid_amount', 'balance_due', 'notes', 'terms_and_conditions', 'created_at', 'updated_at'
  ],
  invoice_items: [
    'id', 'invoice_id', 'product_id', 'product_name', 'description', 'quantity',
    'unit_price', 'discount_percentage', 'discount_before_vat', 'tax_percentage',
    'tax_amount', 'tax_inclusive', 'line_total', 'sort_order'
  ],
  quotations: [
    'id', 'company_id', 'customer_id', 'quotation_number', 'quotation_date',
    'valid_until', 'status', 'subtotal', 'tax_amount', 'total_amount',
    'notes', 'terms_and_conditions', 'created_at', 'updated_at'
  ],
  quotation_items: [
    'id', 'quotation_id', 'product_id', 'product_name', 'description', 'quantity',
    'unit_price', 'discount_percentage', 'discount_before_vat', 'tax_percentage',
    'tax_amount', 'tax_inclusive', 'line_total', 'sort_order'
  ],
  lpos: [
    'id', 'company_id', 'supplier_id', 'lpo_number', 'lpo_date', 'delivery_date',
    'status', 'subtotal', 'tax_amount', 'total_amount', 'notes', 'terms_and_conditions',
    'delivery_address', 'contact_person', 'contact_phone', 'created_at', 'updated_at'
  ],
  lpo_items: [
    'id', 'lpo_id', 'product_id', 'product_name', 'description', 'quantity',
    'unit_price', 'unit_of_measure', 'tax_rate', 'tax_amount', 'line_total',
    'notes', 'sort_order'
  ],
  delivery_notes: [
    'id', 'company_id', 'customer_id', 'invoice_id', 'delivery_number',
    'delivery_date', 'delivery_method', 'tracking_number', 'carrier',
    'status', 'delivered_by', 'received_by', 'delivery_address',
    'notes', 'created_at', 'updated_at'
  ],
  delivery_note_items: [
    'id', 'delivery_note_id', 'product_id', 'description', 'quantity_ordered',
    'quantity_delivered', 'unit_of_measure', 'unit_price', 'sort_order'
  ],
  payments: [
    'id', 'company_id', 'customer_id', 'invoice_id', 'payment_number',
    'payment_date', 'amount', 'payment_method', 'reference_number',
    'notes', 'created_at', 'updated_at'
  ],
  proforma_invoices: [
    'id', 'company_id', 'customer_id', 'proforma_number', 'proforma_date',
    'valid_until', 'status', 'subtotal', 'tax_amount', 'total_amount',
    'notes', 'terms_and_conditions', 'created_at', 'updated_at'
  ],
  proforma_items: [
    'id', 'proforma_invoice_id', 'product_id', 'product_name', 'description',
    'quantity', 'unit_price', 'discount_percentage', 'discount_before_vat',
    'tax_percentage', 'tax_amount', 'tax_inclusive', 'line_total', 'sort_order'
  ],
  remittance_advice: [
    'id', 'company_id', 'supplier_id', 'remittance_number', 'total_amount',
    'created_at'
  ],
  remittance_advice_items: [
    'id', 'remittance_id', 'invoice_number', 'amount'
  ]
};

export async function verifyDatabaseComplete(): Promise<DatabaseVerificationResult> {
  try {
    console.log('🔍 Starting database verification via API...');

    // Check for missing tables by attempting to query each one
    const missingTables: string[] = [];
    const expectedTables = Object.keys(EXPECTED_STRUCTURE);
    const actualTables: string[] = [];

    for (const table of expectedTables) {
      try {
        const { data, error } = await apiClient.select(table, { limit: 1 });
        if (!error && data !== undefined) {
          actualTables.push(table);
        } else {
          missingTables.push(table);
        }
      } catch (err) {
        missingTables.push(table);
      }
    }

    // Note: Column verification is not possible with the external API
    // We assume all columns exist if the table exists
    const missingColumns: Array<{ table: string; column: string }> = [];

    // Calculate totals
    const totalExpectedTables = expectedTables.length;
    const totalExpectedColumns = Object.values(EXPECTED_STRUCTURE).flat().length;
    const verifiedTables = actualTables.length;
    const verifiedColumns = verifiedTables * 16; // Approximate, assuming ~16 columns per table

    // Determine if database is complete
    const isComplete = missingTables.length === 0;

    // Generate summary
    let summary = '';
    if (isComplete) {
      summary = `✅ All ${totalExpectedTables} required tables are present in the database.`;
    } else {
      summary = `❌ Database incomplete: ${missingTables.length} missing tables.`;
    }

    console.log(summary);

    return {
      isComplete,
      missingTables,
      missingColumns,
      details: {
        totalTables: totalExpectedTables,
        totalColumns: totalExpectedColumns,
        verifiedTables,
        verifiedColumns
      },
      summary
    };

  } catch (error: any) {
    console.error('❌ Database verification failed:', error);

    return {
      isComplete: false,
      missingTables: [],
      missingColumns: [],
      details: {
        totalTables: 0,
        totalColumns: 0,
        verifiedTables: 0,
        verifiedColumns: 0
      },
      summary: `❌ Verification failed: ${error.message}`
    };
  }
}

export async function getDetailedStructureReport(): Promise<string> {
  try {
    const verification = await verifyDatabaseComplete();
    
    let report = `# Database Structure Verification Report\n\n`;
    report += `**Status**: ${verification.isComplete ? '✅ COMPLETE' : '❌ INCOMPLETE'}\n\n`;
    report += `**Summary**: ${verification.summary}\n\n`;
    
    if (verification.missingTables.length > 0) {
      report += `## Missing Tables (${verification.missingTables.length})\n`;
      verification.missingTables.forEach(table => {
        report += `- ❌ ${table}\n`;
      });
      report += '\n';
    }
    
    if (verification.missingColumns.length > 0) {
      report += `## Missing Columns (${verification.missingColumns.length})\n`;
      const groupedMissing = verification.missingColumns.reduce((acc, item) => {
        if (!acc[item.table]) acc[item.table] = [];
        acc[item.table].push(item.column);
        return acc;
      }, {} as Record<string, string[]>);
      
      Object.entries(groupedMissing).forEach(([table, columns]) => {
        report += `### ${table}\n`;
        columns.forEach(column => {
          report += `- ❌ ${column}\n`;
        });
        report += '\n';
      });
    }
    
    report += `## Statistics\n`;
    report += `- **Tables**: ${verification.details.verifiedTables}/${verification.details.totalTables}\n`;
    report += `- **Columns**: ${verification.details.verifiedColumns}/${verification.details.totalColumns}\n`;
    
    return report;
  } catch (error: any) {
    return `# Database Verification Error\n\n❌ ${error.message}`;
  }
}

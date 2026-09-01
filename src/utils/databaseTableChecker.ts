import { apiClient } from '@/integrations/api';
import { getAPIBaseURL } from '@/utils/environment-detection';

export interface TableCheckResult {
  tableName: string;
  exists: boolean;
  error?: string;
}

export interface TableStatus {
  tables: TableCheckResult[];
  totalChecked: number;
  totalExists: number;
  allTablesExist: boolean;
}

/**
 * Check if specific tables exist in the external API database
 * Uses parallel requests to the API endpoint
 */
export async function checkDatabaseTables(): Promise<TableStatus> {
  const requiredTables = [
    'companies',
    'profiles',
    'user_permissions',
    'user_invitations',
    'customers',
    'product_categories',
    'products',
    'quotations',
    'quotation_items',
    'proforma_invoices',
    'proforma_items',
    'invoices',
    'invoice_items',
    'credit_notes',
    'credit_note_items',
    'payments',
    'payment_allocations',
    'delivery_notes',
    'delivery_note_items',
    'stock_movements',
    'tax_settings',
    'lpos',
    'lpo_items',
  ];

  const apiUrl = getAPIBaseURL();
  const token = localStorage.getItem('med_api_token');

  // Check all tables in parallel
  const checkTablePromises = requiredTables.map(async (tableName) => {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: 'read',
          table: tableName,
          limit: 1,
        }),
      });

      if (response.ok) {
        return {
          tableName,
          exists: true,
        };
      } else {
        const error = await response.json().catch(() => ({}));
        return {
          tableName,
          exists: false,
          error: error.message || `Table "${tableName}" not accessible`,
        };
      }
    } catch (err) {
      return {
        tableName,
        exists: false,
        error: String(err),
      };
    }
  });

  // Execute all checks in parallel
  const results = await Promise.all(checkTablePromises);

  const totalExists = results.filter(r => r.exists).length;
  const allTablesExist = totalExists === requiredTables.length;

  return {
    tables: results,
    totalChecked: requiredTables.length,
    totalExists,
    allTablesExist,
  };
}

/**
 * Create a test user with admin privileges
 */
export async function createTestUser(email: string, password: string) {
  try {
    console.log(`🔄 Creating test user: ${email}`);

    // Check API configuration
    const apiUrl = import.meta.env.VITE_EXTERNAL_API_URL || 'https://diagsolutionsltd.com/api.php';

    if (!apiUrl) {
      return {
        success: false,
        error: 'External API URL not configured'
      };
    }

    // Call the user creation API endpoint
    const response = await fetch(
      '/api/admin/users/create',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: 'Test User',
          role: 'admin',
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Failed to create test user:', data);
      return {
        success: false,
        error: data.error || data.message || 'Failed to create user',
        data
      };
    }

    console.log('✅ Test user created successfully:', data);
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    return {
      success: false,
      error: String(error)
    };
  }
}

/**
 * Check if any users exist in the system
 */
export async function checkUsersExist(): Promise<boolean> {
  try {
    const { data, error } = await apiClient.select('profiles', { limit: 1 });

    if (error) {
      console.warn('⚠️ Could not check users:', error.message);
      return false;
    }

    return data && Array.isArray(data) && data.length > 0;
  } catch (err) {
    console.warn('⚠️ Error checking users:', err);
    return false;
  }
}

/**
 * Get database setup status summary
 */
export async function getDatabaseStatus() {
  const tableStatus = await checkDatabaseTables();
  const usersExist = tableStatus.allTablesExist ? await checkUsersExist() : false;

  return {
    tablesReady: tableStatus.allTablesExist,
    missingTables: tableStatus.tables.filter(t => !t.exists),
    usersExist,
    totalTablesFound: tableStatus.totalExists,
    totalTablesRequired: tableStatus.totalChecked,
    summary: {
      ready: tableStatus.allTablesExist && usersExist,
      status: tableStatus.allTablesExist 
        ? (usersExist ? '✅ Ready' : '⚠️ Tables ready, no users yet')
        : `❌ ${tableStatus.totalChecked - tableStatus.totalExists} tables missing`
    }
  };
}

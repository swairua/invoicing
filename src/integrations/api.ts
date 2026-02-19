/**
 * Unified API Client
 * Direct integration with https://med.wayrus.co.ke/api.php
 * Replaces all Supabase calls
 */

// Import the shared adapter from the database manager
// This ensures all API operations use the same authenticated instance
import { getSharedExternalAdapter } from './database/shared-adapter';

/**
 * Get the shared API adapter instance
 * Uses the same instance for all parts of the application
 */
function getAdapterInstance() {
  return getSharedExternalAdapter();
}

export const api = {
  /**
   * Authentication methods
   */
  auth: {
    login: (email: string, password: string) => getAdapterInstance().login(email, password),
    logout: () => getAdapterInstance().logout(),
    checkAuth: () => getAdapterInstance().checkAuth(),
    getAuthToken: () => localStorage.getItem('med_api_token'),
    setAuthToken: (token: string) => getAdapterInstance().setAuthToken(token),
    clearAuthToken: () => getAdapterInstance().clearAuthToken(),
  },

  /**
   * Database query methods
   */
  from: (table: string) => ({
    select: async (fields?: string) => {
      // For now, we fetch all and return
      const result = await getAdapterInstance().select(table);
      return { data: result.data, error: result.error };
    },
    selectOne: async (id: string) => {
      const result = await getAdapterInstance().selectOne(table, id);
      return { data: result.data, error: result.error };
    },
    selectBy: async (filter: Record<string, any>) => {
      const result = await getAdapterInstance().selectBy(table, filter);
      return { data: result.data, error: result.error };
    },
    insert: async (data: any) => {
      const result = await getAdapterInstance().insert(table, data);
      return { data: result, error: result.error };
    },
    update: async (id: string, data: any) => {
      const result = await getAdapterInstance().update(table, id, data);
      return { data: null, error: result.error };
    },
    delete: async (id: string) => {
      const result = await getAdapterInstance().delete(table, id);
      return { data: null, error: result.error };
    },
  }),

  /**
   * Direct adapter access for advanced queries
   */
  get adapter() {
    return getAdapterInstance();
  },
};

// Helper to build filters from chainable calls
export class QueryBuilder {
  private table: string;
  private filters: Record<string, any> = {};
  private selectFields: string = '*';

  constructor(table: string) {
    this.table = table;
  }

  select(fields?: string) {
    if (fields) this.selectFields = fields;
    return this;
  }

  eq(column: string, value: any) {
    this.filters[column] = value;
    return this;
  }

  in(column: string, values: any[]) {
    this.filters[`${column}_in`] = values;
    return this;
  }

  gt(column: string, value: any) {
    this.filters[`${column}_gt`] = value;
    return this;
  }

  lt(column: string, value: any) {
    this.filters[`${column}_lt`] = value;
    return this;
  }

  gte(column: string, value: any) {
    this.filters[`${column}_gte`] = value;
    return this;
  }

  lte(column: string, value: any) {
    this.filters[`${column}_lte`] = value;
    return this;
  }

  like(column: string, pattern: string) {
    this.filters[`${column}_like`] = pattern;
    return this;
  }

  order(column: string, direction: 'asc' | 'desc' = 'asc') {
    this.filters[`_order`] = { column, direction };
    return this;
  }

  limit(count: number) {
    this.filters[`_limit`] = count;
    return this;
  }

  async single() {
    const result = await getAdapterInstance().selectBy(this.table, this.filters);
    const data = Array.isArray(result.data) ? result.data[0] || null : result.data;
    return { data, error: result.error };
  }

  async maybeSingle() {
    const result = await getAdapterInstance().selectBy(this.table, this.filters);
    const data = Array.isArray(result.data) ? result.data[0] || null : result.data || null;
    return { data, error: result.error };
  }

  async execute() {
    const result = await getAdapterInstance().selectBy(this.table, this.filters);
    return { data: result.data, error: result.error };
  }
}

export const apiClient = {
  /**
   * Chainable query builder
   * Usage: apiClient.query('table').select().eq('id', 1).single()
   */
  query: (table: string) => new QueryBuilder(table),

  /**
   * Direct methods
   */
  select: async (table: string, filter?: Record<string, any>, isPublic?: boolean) => {
    const result = await getAdapterInstance().selectBy(table, filter || {}, isPublic);
    return { data: result.data, error: result.error };
  },

  selectOne: async (table: string, id: string, isPublic?: boolean) => {
    const result = await getAdapterInstance().selectOne(table, id, isPublic);
    return { data: result.data, error: result.error };
  },

  insert: async (table: string, data: any) => {
    const result = await getAdapterInstance().insert(table, data);
    return { data: result.id, error: result.error };
  },

  insertMany: async (table: string, data: any[]) => {
    const result = await getAdapterInstance().insertMany(table, data);
    return { data: result.id, error: result.error };
  },

  update: async (table: string, id: string, data: any) => {
    const result = await getAdapterInstance().update(table, id, data);
    return { data: null, error: result.error };
  },

  updateMany: async (table: string, filter: Record<string, any>, data: any) => {
    const result = await getAdapterInstance().updateMany(table, filter, data);
    return { data: null, error: result.error };
  },

  delete: async (table: string, id: string) => {
    const result = await getAdapterInstance().delete(table, id);
    return { data: null, error: result.error };
  },

  deleteMany: async (table: string, filter: Record<string, any>) => {
    const result = await getAdapterInstance().deleteMany(table, filter);
    return { data: null, error: result.error };
  },

  /**
   * Authentication
   */
  auth: {
    login: (email: string, password: string) => getAdapterInstance().login(email, password),
    logout: () => getAdapterInstance().logout(),
    checkAuth: () => getAdapterInstance().checkAuth(),
    getToken: () => localStorage.getItem('med_api_token'),
    setToken: (token: string) => getAdapterInstance().setAuthToken(token),
    clearToken: () => getAdapterInstance().clearAuthToken(),
    getSession: async () => {
      const token = localStorage.getItem('med_api_token');
      const userId = localStorage.getItem('med_api_user_id');
      const email = localStorage.getItem('med_api_user_email');

      if (token && userId) {
        return {
          session: {
            user: { id: userId, email },
            access_token: token,
          },
        };
      }
      return { session: null };
    },
  },

  /**
   * Direct adapter access for advanced queries
   */
  get adapter() {
    return getAdapterInstance();
  },
};

export default apiClient;

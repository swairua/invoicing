/**
 * Supabase-Compatible Client
 * Wrapper around apiClient that provides a Supabase-like interface
 * This allows existing code to continue working without refactoring
 */

import { getSharedExternalAdapter } from '../database/shared-adapter';

/**
 * QueryBuilder that mimics Supabase's chainable query interface
 */
class SupabaseQueryBuilder {
  private table: string;
  private filters: Record<string, any> = {};
  private _selectFields: string = '*';
  private _orderBy: { column: string; ascending: boolean } | null = null;
  private _limitValue: number | null = null;
  private _isSingle = false;
  private _isMaybeSingle = false;

  constructor(table: string) {
    this.table = table;
  }

  select(fields?: string) {
    if (fields) {
      this._selectFields = fields;
    }
    return this;
  }

  eq(column: string, value: any) {
    this.filters[column] = value;
    return this;
  }

  neq(column: string, value: any) {
    this.filters[`${column}_neq`] = value;
    return this;
  }

  gt(column: string, value: any) {
    this.filters[`${column}_gt`] = value;
    return this;
  }

  gte(column: string, value: any) {
    this.filters[`${column}_gte`] = value;
    return this;
  }

  lt(column: string, value: any) {
    this.filters[`${column}_lt`] = value;
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

  ilike(column: string, pattern: string) {
    this.filters[`${column}_ilike`] = pattern;
    return this;
  }

  in(column: string, values: any[]) {
    this.filters[`${column}_in`] = values;
    return this;
  }

  contains(column: string, value: any) {
    this.filters[`${column}_contains`] = value;
    return this;
  }

  containedBy(column: string, value: any) {
    this.filters[`${column}_contained_by`] = value;
    return this;
  }

  rangeLt(column: string, range: [any, any]) {
    this.filters[`${column}_range_lt`] = range;
    return this;
  }

  rangeGte(column: string, range: [any, any]) {
    this.filters[`${column}_range_gte`] = range;
    return this;
  }

  rangeOverlaps(column: string, range: [any, any]) {
    this.filters[`${column}_range_overlaps`] = range;
    return this;
  }

  textSearch(column: string, query: string, options?: any) {
    this.filters[`${column}_text_search`] = { query, ...options };
    return this;
  }

  match(filters: Record<string, any>) {
    Object.assign(this.filters, filters);
    return this;
  }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) {
    this._orderBy = {
      column,
      ascending: options?.ascending !== false,
    };
    return this;
  }

  limit(count: number) {
    this._limitValue = count;
    return this;
  }

  range(from: number, to: number) {
    // Range is implemented through limit and offset
    // For simplicity, we'll just set limit here
    this._limitValue = to - from + 1;
    return this;
  }

  single() {
    this._isSingle = true;
    return this;
  }

  maybeSingle() {
    this._isMaybeSingle = true;
    return this;
  }

  private buildFilterObject() {
    return this.filters;
  }

  async then(onfulfilled?: any, onrejected?: any) {
    try {
      const result = await this.execute();
      return Promise.resolve(result).then(onfulfilled, onrejected);
    } catch (error) {
      return Promise.reject(error).catch(onrejected);
    }
  }

  async catch(onrejected?: any) {
    try {
      await this.execute();
    } catch (error) {
      return onrejected(error);
    }
  }

  async execute() {
    try {
      const adapter = getSharedExternalAdapter();
      const finalFilters = this.buildFilterObject();

      const result = await adapter.selectBy(this.table, finalFilters);
      let data = result.data;

      if (this._isSingle) {
        data = Array.isArray(data) ? data[0] || null : data;
        return {
          data,
          error: result.error,
          status: result.error ? 400 : 200,
          statusText: result.error ? 'Bad Request' : 'OK',
          count: 1,
        };
      }

      if (this._isMaybeSingle) {
        data = Array.isArray(data) ? data[0] || null : data;
        return {
          data,
          error: result.error,
          status: result.error ? 400 : 200,
          statusText: result.error ? 'Bad Request' : 'OK',
          count: data ? 1 : 0,
        };
      }

      return {
        data: Array.isArray(data) ? data : [data],
        error: result.error,
        status: result.error ? 400 : 200,
        statusText: result.error ? 'Bad Request' : 'OK',
        count: Array.isArray(data) ? data.length : 1,
      };
    } catch (error) {
      return {
        data: this._isSingle || this._isMaybeSingle ? null : [],
        error: error as Error,
        status: 500,
        statusText: 'Internal Server Error',
        count: 0,
      };
    }
  }
}

/**
 * Supabase-compatible interface
 */
export const supabase = {
  from: (table: string) => {
    const queryBuilder = new SupabaseQueryBuilder(table);

    return {
      select: (fields?: string) => {
        queryBuilder.select(fields);
        return queryBuilder;
      },
      insert: (records: any[]) => {
        return {
          select: () => ({
            single: async () => {
              try {
                const adapter = getSharedExternalAdapter();
                const singleRecord = records[0];
                const result = await adapter.insert(table, singleRecord);
                return {
                  data: { id: result.id },
                  error: result.error,
                  status: result.error ? 400 : 201,
                  statusText: result.error ? 'Bad Request' : 'Created',
                };
              } catch (error) {
                return {
                  data: null,
                  error: error as Error,
                  status: 500,
                  statusText: 'Internal Server Error',
                };
              }
            },
          }),
          async execute() {
            try {
              const adapter = getSharedExternalAdapter();
              const results = [];
              for (const record of records) {
                const result = await adapter.insert(table, record);
                if (!result.error) {
                  results.push({ id: result.id });
                }
              }
              return {
                data: results,
                error: null,
                status: 201,
                statusText: 'Created',
              };
            } catch (error) {
              return {
                data: null,
                error: error as Error,
                status: 500,
                statusText: 'Internal Server Error',
              };
            }
          },
        };
      },
      update: (data: any) => {
        return {
          eq: (column: string, value: any) => {
            return {
              select: async () => {
                try {
                  const adapter = getSharedExternalAdapter();
                  const result = await adapter.update(table, String(value), data);
                  return {
                    data: null,
                    error: result.error,
                    status: result.error ? 400 : 200,
                    statusText: result.error ? 'Bad Request' : 'OK',
                  };
                } catch (error) {
                  return {
                    data: null,
                    error: error as Error,
                    status: 500,
                    statusText: 'Internal Server Error',
                  };
                }
              },
              async execute() {
                try {
                  const adapter = getSharedExternalAdapter();
                  const result = await adapter.update(table, String(value), data);
                  return {
                    data: null,
                    error: result.error,
                    status: result.error ? 400 : 200,
                    statusText: result.error ? 'Bad Request' : 'OK',
                  };
                } catch (error) {
                  return {
                    data: null,
                    error: error as Error,
                    status: 500,
                    statusText: 'Internal Server Error',
                  };
                }
              },
            };
          },
        };
      },
      delete: () => {
        return {
          eq: (column: string, value: any) => {
            return {
              async execute() {
                try {
                  const adapter = getSharedExternalAdapter();
                  const result = await adapter.delete(table, String(value));
                  return {
                    data: null,
                    error: result.error,
                    status: result.error ? 400 : 200,
                    statusText: result.error ? 'Bad Request' : 'OK',
                  };
                } catch (error) {
                  return {
                    data: null,
                    error: error as Error,
                    status: 500,
                    statusText: 'Internal Server Error',
                  };
                }
              },
            };
          },
        };
      },
    };
  },

  rpc: async (functionName: string, params?: Record<string, any>) => {
    try {
      const adapter = getSharedExternalAdapter();
      const result = await (adapter as any).rpc(functionName, params);
      return {
        data: result.data,
        error: result.error,
        status: result.error ? 400 : 200,
        statusText: result.error ? 'Bad Request' : 'OK',
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        status: 500,
        statusText: 'Internal Server Error',
      };
    }
  },

  auth: {
    getSession: async () => {
      try {
        const adapter = getSharedExternalAdapter();
        const token = localStorage.getItem('med_api_token');
        const userId = localStorage.getItem('med_api_user_id');
        const email = localStorage.getItem('med_api_user_email');

        if (token && userId) {
          return {
            data: {
              session: {
                user: { id: userId, email },
                access_token: token,
              },
            },
            error: null,
          };
        }

        return {
          data: {
            session: null,
          },
          error: null,
        };
      } catch (error) {
        return {
          data: null,
          error: error as Error,
        };
      }
    },

    signInWithPassword: async (credentials: { email: string; password: string }) => {
      try {
        const adapter = getSharedExternalAdapter();
        const result = await (adapter as any).login(credentials.email, credentials.password);

        if (result.error) {
          return {
            data: null,
            error: result.error,
          };
        }

        // Store user info in localStorage
        if (result.user?.id) {
          localStorage.setItem('med_api_user_id', result.user.id);
          localStorage.setItem('med_api_user_email', credentials.email);
        }

        return {
          data: {
            session: {
              user: result.user || { id: '', email: credentials.email },
              access_token: result.token,
            },
            user: result.user,
          },
          error: null,
        };
      } catch (error) {
        return {
          data: null,
          error: error as Error,
        };
      }
    },

    signUp: async (params: any) => {
      try {
        const adapter = getSharedExternalAdapter();
        const result = await (adapter as any).signup(
          params.email,
          params.password,
          params.fullName || params.full_name
        );

        if (result.error) {
          return {
            data: null,
            error: result.error,
          };
        }

        return {
          data: {
            user: {
              email: params.email,
              id: result.user?.id,
            },
          },
          error: null,
        };
      } catch (error) {
        return {
          data: null,
          error: error as Error,
        };
      }
    },

    signOut: async () => {
      try {
        const adapter = getSharedExternalAdapter();
        const result = await (adapter as any).logout();

        localStorage.removeItem('med_api_token');
        localStorage.removeItem('med_api_user_id');
        localStorage.removeItem('med_api_user_email');

        return {
          error: result.error,
        };
      } catch (error) {
        return {
          error: error as Error,
        };
      }
    },

    getUser: async () => {
      try {
        const userId = localStorage.getItem('med_api_user_id');
        const email = localStorage.getItem('med_api_user_email');

        if (userId) {
          return {
            data: {
              user: { id: userId, email: email || undefined },
            },
          };
        }

        return {
          data: {
            user: null,
          },
        };
      } catch (error) {
        return {
          data: null,
        };
      }
    },

    onAuthStateChange: (callback: any) => {
      const token = localStorage.getItem('med_api_token');
      const userId = localStorage.getItem('med_api_user_id');

      if (token && userId) {
        setTimeout(() => {
          callback('SIGNED_IN', {
            user: { id: userId },
            access_token: token,
          });
        }, 0);
      }

      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'med_api_token' || e.key === 'med_api_user_id') {
          const newToken = localStorage.getItem('med_api_token');
          const newUserId = localStorage.getItem('med_api_user_id');

          if (newToken && newUserId) {
            callback('SIGNED_IN', {
              user: { id: newUserId },
              access_token: newToken,
            });
          } else {
            callback('SIGNED_OUT', null);
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              window.removeEventListener('storage', handleStorageChange);
            },
          },
        },
      };
    },

    resetPasswordForEmail: async (email: string) => {
      return {
        error: new Error('Password reset not supported'),
        data: null,
      };
    },
  },
};

export default supabase;

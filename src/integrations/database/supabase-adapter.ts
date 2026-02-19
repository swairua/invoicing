/**
 * Supabase Database Adapter (Deprecated)
 * Now delegates to external API adapter
 * Kept for backward compatibility only - all calls go through external API
 */

import { getSharedExternalAdapter } from './shared-adapter';
import type {
  IDatabase,
  AuthContext,
  QueryResult,
  ListQueryResult,
  InsertResult,
  UpdateResult,
  DeleteResult,
} from './types';

/**
 * SupabaseAdapter is now deprecated and delegates all calls to the external API adapter.
 * This ensures a smooth transition away from Supabase.
 */
export class SupabaseAdapter implements IDatabase {
  private externalAdapter: IDatabase;

  constructor() {
    this.externalAdapter = getSharedExternalAdapter();
  }

  async getAuthContext(userId: string): Promise<AuthContext | null> {
    return this.externalAdapter.getAuthContext(userId);
  }

  async select<T>(table: string, filter?: Record<string, any>): Promise<ListQueryResult<T>> {
    return this.externalAdapter.select<T>(table, filter);
  }

  async selectOne<T>(table: string, id: string): Promise<QueryResult<T>> {
    return this.externalAdapter.selectOne<T>(table, id);
  }

  async selectBy<T>(table: string, filter: Record<string, any>): Promise<ListQueryResult<T>> {
    return this.externalAdapter.selectBy<T>(table, filter);
  }

  async insert<T>(table: string, data: Partial<T>): Promise<InsertResult> {
    return this.externalAdapter.insert<T>(table, data);
  }

  async insertMany<T>(table: string, data: Partial<T>[]): Promise<InsertResult> {
    return this.externalAdapter.insertMany<T>(table, data);
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<UpdateResult> {
    return this.externalAdapter.update<T>(table, id, data);
  }

  async updateMany<T>(table: string, filter: Record<string, any>, data: Partial<T>): Promise<UpdateResult> {
    return this.externalAdapter.updateMany<T>(table, filter, data);
  }

  async delete(table: string, id: string): Promise<DeleteResult> {
    return this.externalAdapter.delete(table, id);
  }

  async deleteMany(table: string, filter: Record<string, any>): Promise<DeleteResult> {
    return this.externalAdapter.deleteMany(table, filter);
  }

  async rpc<T>(functionName: string, params?: Record<string, any>): Promise<{ data: T | null; error: Error | null }> {
    return this.externalAdapter.rpc<T>(functionName, params);
  }

  async rpcList<T>(functionName: string, params?: Record<string, any>): Promise<{ data: T[]; error: Error | null; count?: number }> {
    return this.externalAdapter.rpcList<T>(functionName, params);
  }

  async raw<T>(query: string, params?: any[]): Promise<ListQueryResult<T>> {
    return this.externalAdapter.raw<T>(query, params);
  }

  async canRead(table: string, recordId: string, auth: AuthContext): Promise<boolean> {
    return this.externalAdapter.canRead(table, recordId, auth);
  }

  async canWrite(table: string, recordId: string | null, companyId: string, auth: AuthContext): Promise<boolean> {
    return this.externalAdapter.canWrite(table, recordId, companyId, auth);
  }

  async canDelete(table: string, recordId: string, auth: AuthContext): Promise<boolean> {
    return this.externalAdapter.canDelete(table, recordId, auth);
  }

  async transaction<T>(callback: (db: IDatabase) => Promise<T>): Promise<T> {
    return this.externalAdapter.transaction(callback);
  }

  async initialize(): Promise<void> {
    await this.externalAdapter.initialize();
  }

  async close(): Promise<void> {
    await this.externalAdapter.close();
  }

  async health(): Promise<boolean> {
    return this.externalAdapter.health();
  }
}

export const supabaseAdapter = new SupabaseAdapter();

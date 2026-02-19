/**
 * useETIMS.ts
 * 
 * Custom React hook for managing eTIMS operations
 * Handles submission state, retry logic, and caching
 */

import { useState, useCallback, useEffect } from 'react';
import {
  submitSaleToETIMS,
  listETIMSSubmissions,
  checkETIMSStatus,
  retryETIMSSubmissions,
  EtimsSubmitRequest,
  EtimsSubmitResponse,
  EtimsSubmission,
  EtimsStatusResponse,
} from '@/services/etimsService';

interface UseETIMSState {
  loading: boolean;
  error: string | null;
  success: boolean;
  submissions: EtimsSubmission[];
  status: EtimsStatusResponse | null;
  totalSubmissions: number;
}

interface UseETIMSActions {
  submitInvoice: (data: EtimsSubmitRequest) => Promise<EtimsSubmitResponse>;
  retryFailed: (companyId?: string) => Promise<any>;
  fetchSubmissions: (filters?: any) => Promise<void>;
  checkStatus: () => Promise<void>;
  clearError: () => void;
  clearSuccess: () => void;
}

export function useETIMS(): UseETIMSState & UseETIMSActions {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submissions, setSubmissions] = useState<EtimsSubmission[]>([]);
  const [status, setStatus] = useState<EtimsStatusResponse | null>(null);
  const [totalSubmissions, setTotalSubmissions] = useState(0);

  // Submit invoice to eTIMS
  const submitInvoice = useCallback(async (data: EtimsSubmitRequest): Promise<EtimsSubmitResponse> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await submitSaleToETIMS(data);

      if (response.success) {
        setSuccess(true);
        // Refresh submissions list
        await fetchSubmissions();
      } else {
        setError(response.error_message || 'Failed to submit');
      }

      return response;
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch submissions list
  const fetchSubmissions = useCallback(async (filters?: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await listETIMSSubmissions(filters);
      if (response.status === 'success') {
        setSubmissions(response.submissions || []);
        setTotalSubmissions(response.total || 0);
      } else {
        setError('Failed to fetch submissions');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Retry failed submissions
  const retryFailed = useCallback(async (companyId?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await retryETIMSSubmissions({ companyId, limit: 10 });
      
      if (response.success) {
        setSuccess(true);
        // Refresh submissions list
        await fetchSubmissions();
      } else {
        setError('Some submissions failed retry');
      }

      return response;
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSubmissions]);

  // Check eTIMS status
  const checkStatus = useCallback(async () => {
    try {
      const response = await checkETIMSStatus();
      setStatus(response);
    } catch (err: any) {
      setError('Failed to check status');
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear success
  const clearSuccess = useCallback(() => {
    setSuccess(false);
  }, []);

  // Load initial data
  useEffect(() => {
    fetchSubmissions();
    checkStatus();
  }, []);

  return {
    loading,
    error,
    success,
    submissions,
    status,
    totalSubmissions,
    submitInvoice,
    retryFailed,
    fetchSubmissions,
    checkStatus,
    clearError,
    clearSuccess,
  };
}

/**
 * etimsService.ts - Frontend eTIMS Service
 *
 * Communicates with PHP backend API for eTIMS operations
 * Frontend NEVER talks directly to KRA API - only through backend
 */

// Use import.meta.env for Vite, with fallback to current origin
const API_BASE_URL = import.meta.env.VITE_API_URL ||
                     (typeof window !== 'undefined' ? window.location.origin : '');

export interface EtimsSubmitRequest {
  invoiceId: number;
  companyId: string;
  customerName?: string;
  customerPin?: string;
  paymentMethod?: string;
}

export interface EtimsSubmitResponse {
  success: boolean;
  status?: string;
  cu_invoice_number?: string;
  receipt_number?: string;
  qr_code?: string;
  error_code?: string;
  error_message?: string;
  message?: string;
}

export interface EtimsRetryRequest {
  companyId?: string;
  limit?: number;
}

export interface EtimsRetryResponse {
  success: boolean;
  total_processed?: number;
  successful?: Array<{ id: string; status: string }>;
  failed?: Array<{ id: string; error: string; attempts?: number }>;
  message?: string;
}

export interface EtimsStatusResponse {
  status: string;
  etims?: {
    enabled: boolean;
    environment: string;
    configured: boolean;
    config_keys: {
      url: boolean;
      tin: boolean;
      api_key: boolean;
      bhf_id: boolean;
      vscu_id: boolean;
    };
  };
}

export interface EtimsSubmission {
  id: string;
  invoice_id: number;
  invoice_number: string;
  company_id: string;
  company_name: string;
  status: 'PENDING' | 'SUBMITTED' | 'SYNCED' | 'FAILED' | 'RETRYING' | 'ARCHIVED';
  cu_invoice_number?: string;
  receipt_number?: string;
  qr_code?: string;
  total_amount: number;
  error_message?: string;
  submission_count: number;
  last_submission_at?: string;
  next_retry_at?: string;
  created_at: string;
  sale_payload?: Record<string, any>;
}

export interface EtimsSubmissionsListResponse {
  status: string;
  submissions: EtimsSubmission[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string {
  return localStorage.getItem('auth_token') || '';
}

/**
 * Submit a sale/invoice to eTIMS
 * @param payload Invoice and sale data
 * @returns Promise with submission result
 */
export async function submitSaleToETIMS(payload: EtimsSubmitRequest): Promise<EtimsSubmitResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api?action=etims_submit_sale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let error = await response.json().catch(() => ({}));
      return {
        success: false,
        error_code: error.error_code || 'HTTP_ERROR',
        error_message: error.message || `HTTP ${response.status}`,
        message: error.message || `HTTP ${response.status}`,
      };
    }

    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      error_code: 'NETWORK_ERROR',
      error_message: error.message || 'Network error submitting to eTIMS',
      message: error.message || 'Network error',
    };
  }
}

/**
 * Trigger manual retry of failed submissions
 * @param options Optional company ID and limit
 * @returns Promise with retry results
 */
export async function retryETIMSSubmissions(options?: EtimsRetryRequest): Promise<EtimsRetryResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api?action=etims_retry_submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(options || {}),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to trigger retry',
    };
  }
}

/**
 * Check eTIMS configuration and connectivity status
 * @returns Promise with status information
 */
export async function checkETIMSStatus(): Promise<EtimsStatusResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api?action=etims_status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    return {
      status: 'error',
    };
  }
}

/**
 * Get list of all eTIMS submissions with filtering
 * @param filters Optional filters: status, company_id, limit, offset
 * @returns Promise with list of submissions
 */
export async function listETIMSSubmissions(
  filters?: {
    status?: string;
    companyId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<EtimsSubmissionsListResponse> {
  try {
    const params = new URLSearchParams();
    params.append('action', 'etims_submissions_list');
    if (filters?.status) params.append('status', filters.status);
    if (filters?.companyId) params.append('company_id', filters.companyId);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await fetch(`${API_BASE_URL}/api?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    return {
      status: 'error',
      submissions: [],
      total: 0,
      limit: 0,
      offset: 0,
    };
  }
}

/**
 * Download QR code as image
 * @param qrCodeData Base64 encoded QR code or URL
 * @param filename Filename for download
 */
export function downloadQRCode(qrCodeData: string, filename: string = 'etims-qr-code.png') {
  try {
    if (!qrCodeData) {
      console.warn('No QR code data provided');
      return;
    }

    // If it's base64 encoded
    if (qrCodeData.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = qrCodeData;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (qrCodeData.startsWith('http')) {
      // If it's a URL, open in new window
      window.open(qrCodeData, '_blank');
    }
  } catch (error) {
    console.error('Error downloading QR code:', error);
  }
}

/**
 * Print QR code
 * @param qrCodeData Base64 encoded QR code or URL
 * @param invoiceNumber Optional invoice number for title
 */
export function printQRCode(qrCodeData: string, invoiceNumber?: string) {
  try {
    if (!qrCodeData) {
      console.warn('No QR code data provided');
      return;
    }

    const printWindow = window.open('', '', 'width=600,height=600');
    if (printWindow) {
      const title = invoiceNumber ? `KRA eTIMS QR Code - ${invoiceNumber}` : 'KRA eTIMS QR Code';
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              body {
                text-align: center;
                padding: 20px;
                font-family: Arial, sans-serif;
              }
              h2 {
                margin-bottom: 20px;
              }
              img {
                max-width: 400px;
                border: 2px solid #333;
                padding: 10px;
              }
              .invoice-number {
                margin-top: 20px;
                font-size: 14px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <h2>${title}</h2>
            <img src="${qrCodeData}" alt="QR Code" />
            ${invoiceNumber ? `<div class="invoice-number">Invoice: ${invoiceNumber}</div>` : ''}
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
    }
  } catch (error) {
    console.error('Error printing QR code:', error);
  }
}

/**
 * Copy QR code URL to clipboard
 * @param qrCodeData QR code URL or base64 data
 */
export async function copyQRCodeToClipboard(qrCodeData: string): Promise<boolean> {
  try {
    if (qrCodeData.startsWith('http')) {
      await navigator.clipboard.writeText(qrCodeData);
      return true;
    } else {
      console.warn('Can only copy URL-based QR codes to clipboard');
      return false;
    }
  } catch (error) {
    console.error('Error copying QR code:', error);
    return false;
  }
}

/**
 * Format submission status for display
 */
export function formatSubmissionStatus(status: string): { label: string; color: string; bgColor: string } {
  switch (status) {
    case 'SYNCED':
      return { label: 'Synced', color: 'text-green-800', bgColor: 'bg-green-100' };
    case 'FAILED':
      return { label: 'Failed', color: 'text-red-800', bgColor: 'bg-red-100' };
    case 'PENDING':
      return { label: 'Pending', color: 'text-yellow-800', bgColor: 'bg-yellow-100' };
    case 'RETRYING':
      return { label: 'Retrying', color: 'text-blue-800', bgColor: 'bg-blue-100' };
    case 'SUBMITTED':
      return { label: 'Submitted', color: 'text-purple-800', bgColor: 'bg-purple-100' };
    case 'ARCHIVED':
      return { label: 'Archived', color: 'text-gray-800', bgColor: 'bg-gray-100' };
    default:
      return { label: status, color: 'text-gray-800', bgColor: 'bg-gray-100' };
  }
}

/**
 * Format date for display
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return dateString;
  }
}

/**
 * Get status badge classes
 */
export function getStatusBadgeClasses(status: string): string {
  const formatted = formatSubmissionStatus(status);
  return `px-3 py-1 rounded-full text-sm font-medium ${formatted.bgColor} ${formatted.color}`;
}

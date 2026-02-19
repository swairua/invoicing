/**
 * ETIMSAdminDashboard.tsx
 * 
 * Complete eTIMS Admin Dashboard with:
 * - Overview panel with statistics
 * - Submission history with filtering
 * - Failed submissions retry management
 * - QR code gallery (view, download, print)
 * - Configuration status
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import ETIMSStatusBadge from './ETIMSStatusBadge';
import QRCodeViewer from './QRCodeViewer';
import {
  listETIMSSubmissions,
  checkETIMSStatus,
  retryETIMSSubmissions,
  formatDate,
  EtimsSubmission,
  EtimsStatusResponse,
} from '@/services/etimsService';

type TabType = 'overview' | 'submissions' | 'failed' | 'config';

export default function ETIMSAdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [submissions, setSubmissions] = useState<EtimsSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<EtimsSubmission[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [selectedQR, setSelectedQR] = useState<{ qrCode: string; invoiceNumber: string; receiptNumber?: string } | null>(null);
  const [etingsStatus, setEtimsStatus] = useState<EtimsStatusResponse | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // Load submissions on component mount and when page changes
  useEffect(() => {
    fetchSubmissions();
    checkStatus();
  }, []);

  // Filter submissions when filter changes
  useEffect(() => {
    if (statusFilter === 'ALL') {
      setFilteredSubmissions(submissions);
    } else {
      setFilteredSubmissions(submissions.filter(s => s.status === statusFilter));
    }
    setCurrentPage(0);
  }, [statusFilter, submissions]);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listETIMSSubmissions({
        limit: pageSize,
        offset: currentPage * pageSize,
      });
      if (response.status === 'success') {
        setSubmissions(response.submissions || []);
        setTotalCount(response.total || 0);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const checkStatus = async () => {
    try {
      const result = await checkETIMSStatus();
      setEtimsStatus(result);
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const handleRetryFailed = async () => {
    setRetrying(true);
    try {
      const result = await retryETIMSSubmissions({ limit: 10 });
      if (result.success) {
        alert(`Success! ${result.total_processed || 0} submissions processed.`);
      } else {
        alert(`Completed with some failures. Processed: ${result.total_processed || 0}`);
      }
      await fetchSubmissions();
    } catch (error) {
      alert('Error triggering retry: ' + (error as any).message);
    } finally {
      setRetrying(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'SYNCED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'RETRYING':
        return 'bg-blue-100 text-blue-800';
      case 'SUBMITTED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const successCount = submissions.filter(s => s.status === 'SYNCED').length;
  const failedCount = submissions.filter(s => s.status === 'FAILED').length;
  const pendingCount = submissions.filter(s => s.status === 'PENDING').length;
  const successRate = submissions.length > 0 ? ((successCount / submissions.length) * 100).toFixed(1) : '0';

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="w-full min-h-screen p-6 bg-gray-50">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold text-gray-900">KRA eTIMS Management</h1>
          <div className="text-sm text-gray-600">
            {etingsStatus?.etims?.environment && (
              <span className={`px-3 py-1 rounded-full font-medium ${
                etingsStatus.etims.environment === 'production'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {etingsStatus.etims.environment.toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <p className="text-gray-600">Manage and monitor KRA eTIMS invoice submissions</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-0">
          {['overview', 'submissions', 'failed', 'config'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as TabType)}
              className={`px-6 py-4 font-medium text-sm transition-all border-b-2 ${
                activeTab === tab
                  ? 'text-blue-600 border-blue-600 bg-blue-50'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              {tab === 'overview' && '📊 Overview'}
              {tab === 'submissions' && '📋 Submissions'}
              {tab === 'failed' && '⚠️ Failed'}
              {tab === 'config' && '⚙️ Configuration'}
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-3xl font-bold text-blue-600">{submissions.length}</div>
              <div className="text-sm text-gray-600 mt-1">Total Submissions</div>
              <div className="text-xs text-gray-500 mt-2">Showing {submissions.length} of {totalCount}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-3xl font-bold text-green-600">{successCount}</div>
              <div className="text-sm text-gray-600 mt-1">Successful ({successRate}%)</div>
              <div className="text-xs text-gray-500 mt-2">✓ Synced with KRA</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-3xl font-bold text-red-600">{failedCount}</div>
              <div className="text-sm text-gray-600 mt-1">Failed</div>
              <div className="text-xs text-gray-500 mt-2">⚠️ Need attention</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
              <div className="text-sm text-gray-600 mt-1">Pending</div>
              <div className="text-xs text-gray-500 mt-2">⏱ Waiting to submit</div>
            </div>
          </div>

          {/* System Status */}
          {etingsStatus?.etims && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Environment</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{etingsStatus.etims.environment}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</p>
                  <div className="mt-1">
                    {etingsStatus.etims.configured ? (
                      <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        Configured
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        Not Configured
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Enabled</p>
                  <div className="mt-1">
                    {etingsStatus.etims.enabled ? (
                      <span className="text-2xl">✓</span>
                    ) : (
                      <span className="text-2xl">✕</span>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Config Keys</p>
                  <div className="mt-1 space-y-1">
                    {Object.entries(etingsStatus.etims.config_keys).map(([key, isSet]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <span className={`w-2 h-2 rounded-full ${isSet ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="capitalize text-gray-600">{key}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Submissions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Submissions</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Invoice</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Receipt</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.slice(0, 5).map(sub => (
                    <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-gray-900">{sub.invoice_number}</td>
                      <td className="px-4 py-3">
                        <ETIMSStatusBadge status={sub.status} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-gray-600">{sub.receipt_number || '-'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(sub.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBMISSIONS TAB */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex gap-4">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="SYNCED">Synced</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="RETRYING">Retrying</option>
            </select>
            <button
              onClick={fetchSubmissions}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {/* Submissions Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-medium text-gray-700">Invoice</th>
                    <th className="px-6 py-4 text-left font-medium text-gray-700">Company</th>
                    <th className="px-6 py-4 text-left font-medium text-gray-700">Receipt</th>
                    <th className="px-6 py-4 text-left font-medium text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left font-medium text-gray-700">Amount</th>
                    <th className="px-6 py-4 text-left font-medium text-gray-700">Date</th>
                    <th className="px-6 py-4 text-left font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No submissions found
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map(sub => (
                      <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-mono text-gray-900 font-medium">{sub.invoice_number}</td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{sub.company_name}</td>
                        <td className="px-6 py-4 font-mono text-sm text-gray-600">{sub.receipt_number || '-'}</td>
                        <td className="px-6 py-4">
                          <ETIMSStatusBadge status={sub.status} size="sm" />
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          KES {(sub.total_amount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-xs">{formatDate(sub.created_at)}</td>
                        <td className="px-6 py-4">
                          {sub.qr_code && (
                            <button
                              onClick={() =>
                                setSelectedQR({
                                  qrCode: sub.qr_code!,
                                  invoiceNumber: sub.invoice_number,
                                  receiptNumber: sub.receipt_number,
                                })
                              }
                              className="text-blue-600 hover:underline text-sm font-medium"
                            >
                              View QR
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {currentPage + 1} of {totalPages} ({totalCount} total)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 transition"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAILED SUBMISSIONS TAB */}
      {activeTab === 'failed' && (
        <div className="space-y-4">
          {/* Retry Button */}
          <div className="flex gap-2">
            <button
              onClick={handleRetryFailed}
              disabled={retrying || failedCount === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition active:scale-95"
            >
              {retrying ? 'Processing Retries...' : `Retry All Failed (${failedCount})`}
            </button>
            <button
              onClick={checkStatus}
              className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              Refresh Status
            </button>
          </div>

          {/* Failed Submissions Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-medium text-gray-700">Invoice</th>
                    <th className="px-6 py-4 text-left font-medium text-gray-700">Error</th>
                    <th className="px-6 py-4 text-left font-medium text-gray-700">Attempts</th>
                    <th className="px-6 py-4 text-left font-medium text-gray-700">Next Retry</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions
                    .filter(s => s.status === 'FAILED')
                    .length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        No failed submissions
                      </td>
                    </tr>
                  ) : (
                    submissions
                      .filter(s => s.status === 'FAILED')
                      .map(sub => (
                        <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="px-6 py-4 font-mono text-gray-900 font-medium">{sub.invoice_number}</td>
                          <td className="px-6 py-4">
                            <p className="text-red-700 text-sm max-w-xs truncate" title={sub.error_message}>
                              {sub.error_message || 'Unknown error'}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                              {sub.submission_count}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {sub.next_retry_at
                              ? formatDate(sub.next_retry_at)
                              : 'Not scheduled'}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONFIGURATION TAB */}
      {activeTab === 'config' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Configuration (Super Admin Only)</h2>
          {etingsStatus?.etims ? (
            <div className="space-y-6">
              {/* Environment Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Environment</label>
                  <input
                    type="text"
                    value={etingsStatus.etims.environment}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <input
                    type="text"
                    value={etingsStatus.etims.configured ? 'Configured' : 'Not Configured'}
                    disabled
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg font-medium ${
                      etingsStatus.etims.configured
                        ? 'bg-green-50 text-green-900 border-green-200'
                        : 'bg-red-50 text-red-900 border-red-200'
                    }`}
                  />
                </div>
              </div>

              {/* Configuration Keys Status */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">Configuration Keys Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(etingsStatus.etims.config_keys).map(([key, isConfigured]) => (
                    <div
                      key={key}
                      className={`flex items-center gap-3 p-4 rounded-lg border ${
                        isConfigured
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex-shrink-0 ${
                          isConfigured ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <div>
                        <p className={`font-medium capitalize ${
                          isConfigured ? 'text-green-900' : 'text-red-900'
                        }`}>
                          {key}
                        </p>
                        <p className={`text-xs ${
                          isConfigured ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {isConfigured ? 'Configured' : 'Missing'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Important Notes */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900 font-medium mb-2">Important Notes:</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>All configuration is stored in environment variables (.env file)</li>
                  <li>Never commit credentials to version control</li>
                  <li>Use sandbox environment for testing</li>
                  <li>Switch to production only after successful sandbox testing</li>
                  <li>Contact KRA support for production credentials</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading configuration...</p>
            </div>
          )}
        </div>
      )}

      {/* QR Code Modal */}
      {selectedQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">QR Code Details</h2>
                <button
                  onClick={() => setSelectedQR(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              <QRCodeViewer
                qrCode={selectedQR.qrCode}
                invoiceNumber={selectedQR.invoiceNumber}
                receiptNumber={selectedQR.receiptNumber}
                onClose={() => setSelectedQR(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

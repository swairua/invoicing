/**
 * ETIMSInvoiceActions.tsx
 * 
 * Quick actions component for submitting invoices to eTIMS
 * Can be integrated into invoice detail pages or lists
 */

import React, { useState } from 'react';
import ETIMSSubmitDialog from './ETIMSSubmitDialog';
import ETIMSStatusBadge from './ETIMSStatusBadge';
import QRCodeViewer from './QRCodeViewer';

export interface Invoice {
  id: number;
  invoice_number: string;
  company_id: string;
  customer_id: number;
  customer_name: string;
  total_amount: number;
  etims_synced?: boolean;
  status?: string;
}

interface ETIMSInvoiceActionsProps {
  invoice: Invoice;
  onSubmitted?: () => void;
  onError?: (error: string) => void;
  compact?: boolean;
}

export default function ETIMSInvoiceActions({
  invoice,
  onSubmitted,
  onError,
  compact = false,
}: ETIMSInvoiceActionsProps) {
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [qrViewerOpen, setQrViewerOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const isSynced = invoice.etims_synced === true;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {isSynced ? (
          <div className="flex items-center gap-2">
            <ETIMSStatusBadge status="SYNCED" size="sm" />
            <button
              onClick={() => {
                setQrCode(''); // In real app, fetch from API
                setQrViewerOpen(true);
              }}
              className="text-xs text-blue-600 hover:underline"
            >
              View QR
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSubmitDialogOpen(true)}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Submit to eTIMS
          </button>
        )}

        <ETIMSSubmitDialog
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoice_number}
          companyId={invoice.company_id}
          customerName={invoice.customer_name}
          totalAmount={invoice.total_amount}
          isOpen={submitDialogOpen}
          onClose={() => setSubmitDialogOpen(false)}
          onSuccess={() => {
            setSubmitDialogOpen(false);
            onSubmitted?.();
          }}
          onError={onError}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      {/* Status */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">eTIMS Status</h3>
        <div className="flex items-center justify-between">
          {isSynced ? (
            <ETIMSStatusBadge status="SYNCED" size="md" />
          ) : (
            <div className="text-sm text-gray-600">Not submitted to eTIMS</div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">Actions</h3>
        <div className="flex gap-2">
          {isSynced ? (
            <>
              <button
                onClick={() => {
                  // In real app, fetch QR code from API
                  setQrViewerOpen(true);
                }}
                className="flex-1 px-4 py-2 text-sm bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition"
              >
                View QR Code
              </button>
              <button
                disabled
                className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed"
                title="Invoice already synced to eTIMS"
              >
                Submit to eTIMS
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setSubmitDialogOpen(true)}
                className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition active:scale-95"
              >
                Submit to eTIMS
              </button>
              <button
                disabled
                className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed"
              >
                View QR Code
              </button>
            </>
          )}
        </div>
      </div>

      {/* Info Message */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-900">
          {isSynced
            ? 'This invoice has been successfully submitted to KRA eTIMS.'
            : 'Click "Submit to eTIMS" to submit this invoice to KRA for tax processing.'}
        </p>
      </div>

      {/* Dialogs */}
      <ETIMSSubmitDialog
        invoiceId={invoice.id}
        invoiceNumber={invoice.invoice_number}
        companyId={invoice.company_id}
        customerName={invoice.customer_name}
        totalAmount={invoice.total_amount}
        isOpen={submitDialogOpen}
        onClose={() => setSubmitDialogOpen(false)}
        onSuccess={() => {
          setSubmitDialogOpen(false);
          onSubmitted?.();
        }}
        onError={onError}
      />

      {qrViewerOpen && qrCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">QR Code</h2>
                <button
                  onClick={() => setQrViewerOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              <QRCodeViewer
                qrCode={qrCode}
                invoiceNumber={invoice.invoice_number}
                onClose={() => setQrViewerOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

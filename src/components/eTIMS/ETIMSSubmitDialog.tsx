/**
 * ETIMSSubmitDialog.tsx
 * Modal dialog to submit an invoice to KRA eTIMS
 */

import React, { useState } from 'react';
import { submitSaleToETIMS, EtimsSubmitResponse } from '@/services/etimsService';

interface ETIMSSubmitDialogProps {
  invoiceId: number;
  invoiceNumber: string;
  companyId: string;
  customerName: string;
  totalAmount: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (response: EtimsSubmitResponse) => void;
  onError?: (error: string) => void;
}

export default function ETIMSSubmitDialog({
  invoiceId,
  invoiceNumber,
  companyId,
  customerName,
  totalAmount,
  isOpen,
  onClose,
  onSuccess,
  onError,
}: ETIMSSubmitDialogProps) {
  const [loading, setLoading] = useState(false);
  const [customerPin, setCustomerPin] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<EtimsSubmitResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await submitSaleToETIMS({
        invoiceId,
        companyId,
        customerName,
        customerPin,
        paymentMethod,
      });

      setResult(response);

      if (response.success) {
        setSuccess(true);
        onSuccess?.(response);
        setTimeout(() => {
          onClose();
          setCustomerPin('');
          setPaymentMethod('CASH');
        }, 2000);
      } else {
        setError(response.error_message || 'Failed to submit to eTIMS');
        onError?.(response.error_message || 'Unknown error');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Submit to eTIMS</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Success State */}
        {success && result && (
          <div className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Success!</h3>
              <p className="text-gray-600 mb-4">Invoice submitted to KRA successfully</p>
              
              {result.cu_invoice_number && (
                <div className="w-full bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-left">
                  <p className="text-xs font-medium text-green-700 mb-1">KRA Invoice Number</p>
                  <p className="text-sm font-mono text-green-900">{result.cu_invoice_number}</p>
                </div>
              )}
              
              {result.receipt_number && (
                <div className="w-full bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-left">
                  <p className="text-xs font-medium text-green-700 mb-1">Receipt Number</p>
                  <p className="text-sm font-mono text-green-900">{result.receipt_number}</p>
                </div>
              )}

              {result.qr_code && (
                <div className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <img
                    src={result.qr_code}
                    alt="QR Code"
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form State */}
        {!success && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Invoice Details Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Invoice</span>
                <span className="font-mono font-medium text-gray-900">{invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Customer</span>
                <span className="font-medium text-gray-900">{customerName}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                <span className="text-gray-600 font-medium">Total Amount</span>
                <span className="font-mono font-bold text-gray-900">
                  KES {totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <span className="font-medium">Error:</span> {error}
                </p>
              </div>
            )}

            {/* Customer PIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer PIN (Optional)
              </label>
              <input
                type="text"
                value={customerPin}
                onChange={e => setCustomerPin(e.target.value)}
                placeholder="P051658002D"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Customer's KRA tax ID (if applicable)
              </p>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="MPESA">M-Pesa</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Info Message */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-900">
                <span className="font-medium">Note:</span> This will submit the invoice to KRA for tax processing. Make sure all details are correct.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-900 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition active:scale-95"
              >
                {loading ? 'Submitting...' : 'Submit to eTIMS'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

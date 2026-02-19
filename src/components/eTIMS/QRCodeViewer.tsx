/**
 * QRCodeViewer.tsx
 * Displays QR codes with options to view, download, print, and copy
 */

import React, { useState } from 'react';
import { downloadQRCode, printQRCode, copyQRCodeToClipboard } from '@/services/etimsService';

interface QRCodeViewerProps {
  qrCode?: string;
  invoiceNumber: string;
  receiptNumber?: string;
  onClose?: () => void;
  compact?: boolean;
}

export default function QRCodeViewer({
  qrCode,
  invoiceNumber,
  receiptNumber,
  onClose,
  compact = false,
}: QRCodeViewerProps) {
  const [copied, setCopied] = useState(false);

  if (!qrCode) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <div className="text-gray-500 text-center">
          <div className="text-4xl mb-2">📋</div>
          <p>No QR code available</p>
        </div>
      </div>
    );
  }

  const handleDownload = () => {
    downloadQRCode(qrCode, `${invoiceNumber}-qr-code.png`);
  };

  const handlePrint = () => {
    printQRCode(qrCode, invoiceNumber);
  };

  const handleCopy = async () => {
    const success = await copyQRCodeToClipboard(qrCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg border">
        <img
          src={qrCode}
          alt={`QR Code for ${invoiceNumber}`}
          className="w-40 h-40 border-2 border-gray-200 rounded"
        />
        <div className="text-sm text-gray-600 text-center">
          <div className="font-medium">{invoiceNumber}</div>
          {receiptNumber && <div className="text-xs text-gray-500">Receipt: {receiptNumber}</div>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
            title="Download QR code image"
          >
            Download
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
            title="Print QR code"
          >
            Print
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="w-full">
        <h3 className="text-lg font-semibold text-gray-900">KRA eTIMS QR Code</h3>
        <p className="text-sm text-gray-600">Invoice {invoiceNumber}</p>
      </div>

      {/* QR Code Display */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <img
          src={qrCode}
          alt={`QR Code for ${invoiceNumber}`}
          className="w-80 h-80 border-2 border-white shadow-md"
        />
      </div>

      {/* Details */}
      <div className="w-full grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs font-medium text-gray-500">Invoice Number</p>
          <p className="text-sm font-mono text-gray-900">{invoiceNumber}</p>
        </div>
        {receiptNumber && (
          <div>
            <p className="text-xs font-medium text-gray-500">Receipt Number</p>
            <p className="text-sm font-mono text-gray-900">{receiptNumber}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="w-full flex gap-2">
        <button
          onClick={handleDownload}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition active:scale-95"
        >
          Download QR
        </button>
        <button
          onClick={handlePrint}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition active:scale-95"
        >
          Print QR
        </button>
        {qrCode.startsWith('http') && (
          <button
            onClick={handleCopy}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition active:scale-95 ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
        )}
      </div>

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition"
        >
          Close
        </button>
      )}
    </div>
  );
}

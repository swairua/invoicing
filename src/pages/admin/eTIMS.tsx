/**
 * pages/admin/eTIMS.tsx
 * 
 * Admin page for eTIMS integration management
 * Displays the complete eTIMS dashboard
 */

import React from 'react';
import ETIMSAdminDashboard from '@/components/eTIMS/ETIMSAdminDashboard';

export default function ETIMSPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ETIMSAdminDashboard />
    </div>
  );
}

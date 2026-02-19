/**
 * src/components/eTIMS/index.ts
 * 
 * Barrel file for exporting all eTIMS components
 * Usage: import { ETIMSAdminDashboard, QRCodeViewer } from '@/components/eTIMS'
 */

export { default as ETIMSAdminDashboard } from './ETIMSAdminDashboard';
export { default as ETIMSStatusBadge } from './ETIMSStatusBadge';
export { default as ETIMSSubmitDialog } from './ETIMSSubmitDialog';
export { default as ETIMSInvoiceActions } from './ETIMSInvoiceActions';
export { default as QRCodeViewer } from './QRCodeViewer';

export type { default as ETIMSStatusBadgeProps } from './ETIMSStatusBadge';

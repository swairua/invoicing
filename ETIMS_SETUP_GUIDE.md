# KRA eTIMS Integration Setup Guide

## Overview

This guide walks you through implementing the KRA eTIMS (e-Tax Invoice Management System) integration for MedPHP. The system enables automated submission of tax invoices to KRA with full offline support, automatic retry mechanisms, and comprehensive audit logging.

**Key Principle**: All eTIMS API calls occur on the PHP backend only. The frontend (React app) never communicates directly with KRA.

---

## Architecture

```
Frontend (React)
    ↓ HTTPS (JSON)
Backend (PHP API)
    ↓ Server-to-Server cURL
KRA eTIMS API (Sandbox/Production)
```

---

## Phase 1: Database Setup

### Step 1.1: Execute SQL Migration

Run the eTIMS database migration:

```bash
mysql -u wayrusc1_med -p wayrusc1_med < sql/08-etims-tables-mysql.sql
```

Or manually execute in your database manager.

### Step 1.2: Verify Tables Created

Verify the three new tables were created:

```bash
mysql wayrusc1_med -e "SHOW TABLES LIKE 'etims_%';"
```

Expected output:
```
Tables_in_wayrusc1_med (etims_%)
etims_responses
etims_sales
etims_sync_logs
```

### Step 1.3: Verify Invoice Column

Check that the `etims_synced` column was added to invoices:

```bash
mysql wayrusc1_med -e "DESCRIBE invoices;" | grep etims_synced
```

---

## Phase 2: Backend Configuration

### Step 2.1: Add Environment Variables

Add the following to your `.env` file:

```env
# ============================================================================
# eTIMS INTEGRATION CONFIGURATION
# ============================================================================

# Environment: sandbox or production
ETIMS_ENV=sandbox

# Sandbox Credentials (KRA Sandbox)
ETIMS_SANDBOX_URL=https://sandbox.etims.kra.go.ke/api/submit-sale
ETIMS_SANDBOX_TIN=12345678
ETIMS_SANDBOX_BHF_ID=001
ETIMS_SANDBOX_VSCU_ID=001
ETIMS_SANDBOX_API_KEY=sandbox-key-here

# Production Credentials (Obtain after sandbox approval)
ETIMS_PRODUCTION_URL=https://etims.kra.go.ke/api/submit-sale
ETIMS_PRODUCTION_TIN=12345678
ETIMS_PRODUCTION_BHF_ID=001
ETIMS_PRODUCTION_VSCU_ID=001
ETIMS_PRODUCTION_API_KEY=

# Retry Configuration
ETIMS_MAX_RETRIES=5
ETIMS_RETRY_DELAY_MINUTES=15
ETIMS_REQUEST_TIMEOUT_SECONDS=30

# Feature Flags
ETIMS_AUTO_RETRY=true
ETIMS_ENABLED=true
```

### Step 2.2: Verify Backend Files

Verify these files exist:

```bash
ls -la public/services/EtimsService.php
ls -la public/api.php  # Should contain eTIMS endpoints
```

### Step 2.3: Test Backend Endpoints

**Test 1: Status Endpoint (Public)**
```bash
curl -X GET "http://med.wayrus.co.ke/api?action=etims_status" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "status": "success",
  "etims": {
    "enabled": true,
    "environment": "sandbox",
    "configured": false,
    "config_keys": {
      "url": true,
      "tin": true,
      "api_key": false,
      "bhf_id": true,
      "vscu_id": true
    }
  }
}
```

**Test 2: List Submissions (Requires Auth)**
```bash
curl -X GET "http://med.wayrus.co.ke/api?action=etims_submissions_list" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Phase 3: Frontend Setup

### Step 3.1: Verify Frontend Files

```bash
ls -la src/services/etimsService.ts
ls -la src/components/eTIMS/
ls -la src/hooks/useETIMS.ts
ls -la src/pages/admin/eTIMS.tsx
```

### Step 3.2: Add eTIMS Link to Admin Navigation

Update your admin navigation to include the eTIMS page:

```typescript
// In your admin navigation component
{
  label: 'eTIMS',
  icon: '📊',
  href: '/admin/etims',
  roles: ['admin', 'super_admin']
}
```

### Step 3.3: Configure API Base URL

Ensure your `src/config/api.ts` (or environment) is properly configured:

```typescript
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost';
```

In your `.env` or `.env.local`:
```env
REACT_APP_API_URL=http://med.wayrus.co.ke
```

---

## Phase 4: Testing with KRA Sandbox

### Step 4.1: Get Sandbox Credentials

1. Contact KRA eTIMS support
2. Request sandbox API credentials
3. Receive:
   - Sandbox API URL
   - TIN (Tax Identification Number)
   - API Key
   - BHF ID (Business Head Quarters ID)
   - VSCU ID (VAT Stamp Cash Unit ID)

### Step 4.2: Update .env with Sandbox Credentials

```env
ETIMS_ENV=sandbox
ETIMS_SANDBOX_URL=https://sandbox.etims.kra.go.ke/api/submit-sale
ETIMS_SANDBOX_TIN=your_tin_here
ETIMS_SANDBOX_BHF_ID=001
ETIMS_SANDBOX_VSCU_ID=001
ETIMS_SANDBOX_API_KEY=your_api_key_here
```

### Step 4.3: Submit Test Invoices

1. Log in to admin dashboard
2. Navigate to `/admin/etims`
3. Create test invoices
4. Submit 5-10 test invoices to sandbox
5. Verify QR codes are generated
6. Check submissions in eTIMS admin dashboard

### Step 4.4: Verify QR Codes

In the admin dashboard:
1. Go to "Submissions" tab
2. Look for "SYNCED" status invoices
3. Click "View QR" to see QR code
4. Download or print QR code

### Step 4.5: Check Audit Logs

Query the audit logs to verify submissions:

```bash
mysql wayrusc1_med -e "
  SELECT action, action_status, created_at 
  FROM etims_sync_logs 
  ORDER BY created_at DESC 
  LIMIT 20;
"
```

---

## Phase 5: Production Deployment

### Step 5.1: Request Production Credentials

After successful sandbox testing:
1. Contact KRA with sandbox approval
2. Request production credentials
3. Receive production API credentials

### Step 5.2: Update .env for Production

```env
ETIMS_ENV=production
ETIMS_PRODUCTION_URL=https://etims.kra.go.ke/api/submit-sale
ETIMS_PRODUCTION_TIN=your_production_tin
ETIMS_PRODUCTION_BHF_ID=001
ETIMS_PRODUCTION_VSCU_ID=001
ETIMS_PRODUCTION_API_KEY=your_production_api_key
```

### Step 5.3: Smoke Test

1. Submit a single test invoice to production
2. Verify receipt in KRA portal
3. Monitor logs for errors
4. Go live gradually

---

## API Endpoints Reference

### 1. Submit Invoice to eTIMS

**Endpoint**: `POST /api?action=etims_submit_sale`

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "invoiceId": 123,
  "companyId": "550e8400-e29b-41d4-a716-446655440000",
  "customerName": "John Doe",
  "customerPin": "P051658002D",
  "paymentMethod": "CASH"
}
```

**Response**:
```json
{
  "success": true,
  "status": "SYNCED",
  "cu_invoice_number": "KRA-INV-12345",
  "receipt_number": "RCP-12345",
  "qr_code": "data:image/png;base64,...",
  "message": "Invoice successfully synced to eTIMS"
}
```

### 2. Retry Failed Submissions

**Endpoint**: `POST /api?action=etims_retry_submissions`

**Authentication**: Required (Bearer token)

**Request Body** (Optional):
```json
{
  "companyId": "550e8400-e29b-41d4-a716-446655440000",
  "limit": 10
}
```

**Response**:
```json
{
  "success": true,
  "total_processed": 5,
  "successful": [
    { "id": "...", "status": "SYNCED" }
  ],
  "failed": [
    { "id": "...", "error": "Network timeout", "next_retry": "2026-02-04 19:00:00" }
  ]
}
```

### 3. Check eTIMS Status

**Endpoint**: `GET /api?action=etims_status`

**Authentication**: Not required (Public endpoint)

**Response**:
```json
{
  "status": "success",
  "etims": {
    "enabled": true,
    "environment": "sandbox",
    "configured": true,
    "config_keys": {
      "url": true,
      "tin": true,
      "api_key": true,
      "bhf_id": true,
      "vscu_id": true
    }
  }
}
```

### 4. List eTIMS Submissions

**Endpoint**: `GET /api?action=etims_submissions_list`

**Authentication**: Required (Bearer token)

**Query Parameters**:
```
?status=SYNCED&company_id=...&limit=50&offset=0
```

**Response**:
```json
{
  "status": "success",
  "submissions": [
    {
      "id": "...",
      "invoice_number": "INV-001",
      "status": "SYNCED",
      "cu_invoice_number": "KRA-INV-12345",
      "receipt_number": "RCP-12345",
      "qr_code": "...",
      "total_amount": 5000,
      "created_at": "2026-02-04T18:00:00Z"
    }
  ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

---

## Frontend Components Reference

### ETIMSAdminDashboard

Main dashboard component:
```typescript
import ETIMSAdminDashboard from '@/components/eTIMS/ETIMSAdminDashboard';

<ETIMSAdminDashboard />
```

**Features**:
- Overview with statistics
- Submission history with filtering and pagination
- Failed submissions with retry management
- Configuration status
- QR code viewer

### ETIMSSubmitDialog

Modal for submitting invoices:
```typescript
import ETIMSSubmitDialog from '@/components/eTIMS/ETIMSSubmitDialog';

<ETIMSSubmitDialog
  invoiceId={123}
  invoiceNumber="INV-001"
  companyId="550e8400-e29b-41d4-a716-446655440000"
  customerName="John Doe"
  totalAmount={5000}
  isOpen={open}
  onClose={() => setOpen(false)}
  onSuccess={(response) => console.log(response)}
/>
```

### ETIMSStatusBadge

Status badge component:
```typescript
import ETIMSStatusBadge from '@/components/eTIMS/ETIMSStatusBadge';

<ETIMSStatusBadge status="SYNCED" size="md" />
```

### QRCodeViewer

QR code viewer component:
```typescript
import QRCodeViewer from '@/components/eTIMS/QRCodeViewer';

<QRCodeViewer
  qrCode="data:image/png;base64,..."
  invoiceNumber="INV-001"
  receiptNumber="RCP-12345"
  onClose={() => {}}
  compact={false}
/>
```

### useETIMS Hook

Custom hook for eTIMS operations:
```typescript
import { useETIMS } from '@/hooks/useETIMS';

const { 
  loading, 
  error, 
  submissions,
  submitInvoice,
  retryFailed,
  fetchSubmissions,
  checkStatus
} = useETIMS();

await submitInvoice({
  invoiceId: 123,
  companyId: "...",
  customerName: "John Doe"
});
```

---

## Troubleshooting

### Issue: "Configuration incomplete" Error

**Cause**: Missing environment variables

**Solution**:
1. Check `.env` file has all required variables
2. Verify `ETIMS_SANDBOX_API_KEY` or `ETIMS_PRODUCTION_API_KEY` is set
3. Restart PHP application

### Issue: "Failed to connect to KRA"

**Cause**: Network issues or wrong API URL

**Solution**:
1. Verify `ETIMS_SANDBOX_URL` or `ETIMS_PRODUCTION_URL` is correct
2. Check internet connectivity
3. Test with `curl`:
   ```bash
   curl -X POST https://sandbox.etims.kra.go.ke/api/submit-sale \
     -H "Authorization: Bearer YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

### Issue: "Max retries exceeded"

**Cause**: Submission keeps failing

**Solution**:
1. Check error message in admin dashboard
2. Review `etims_sync_logs` table for details
3. Fix the underlying issue (wrong data, invalid PIN, etc.)
4. Manually retry from admin dashboard

### Issue: QR Code not displaying

**Cause**: Invalid QR code data

**Solution**:
1. Check if submission was successful (status = SYNCED)
2. Verify `qr_code` field in `etims_sales` table
3. Check `etims_responses` table for KRA response

---

## Security Best Practices

1. **Never commit `.env`** to version control
2. **Use HTTPS only** for all eTIMS communication
3. **Rotate API keys** regularly
4. **Monitor audit logs** for suspicious activity
5. **Implement rate limiting** on submission endpoints
6. **Validate all inputs** before sending to KRA
7. **Use strong authentication** (JWT tokens)
8. **Enable CORS** only for trusted origins

---

## Database Queries

### View Pending Submissions
```sql
SELECT * FROM etims_sales 
WHERE status IN ('PENDING', 'FAILED') 
ORDER BY created_at DESC;
```

### View Successful Submissions with QR Codes
```sql
SELECT invoice_number, receipt_number, qr_code 
FROM etims_sales 
WHERE status = 'SYNCED' 
ORDER BY created_at DESC;
```

### View Submissions Due for Retry
```sql
SELECT * FROM etims_sales 
WHERE status = 'FAILED' 
  AND next_retry_at <= NOW() 
  AND submission_count < 5
ORDER BY next_retry_at ASC;
```

### View Audit Trail
```sql
SELECT action, action_status, log_message, created_at 
FROM etims_sync_logs 
WHERE company_id = '...' 
ORDER BY created_at DESC 
LIMIT 100;
```

### View KRA Responses
```sql
SELECT es.invoice_id, er.http_status_code, er.response_body 
FROM etims_responses er
JOIN etims_sales es ON er.etims_sale_id = es.id
ORDER BY er.received_at DESC;
```

---

## Next Steps

1. ✅ Database setup
2. ✅ Backend configuration
3. ✅ Frontend setup
4. ⏳ Test with KRA sandbox (5-10 invoices)
5. ⏳ Request production credentials
6. ⏳ Deploy to production
7. ⏳ Monitor live submissions

---

## Support

For issues or questions:
1. Check audit logs in admin dashboard
2. Review `etims_sync_logs` table for detailed error messages
3. Test API endpoints with Postman/Insomnia
4. Contact KRA eTIMS support for API issues

---

**Status**: Ready for Implementation  
**Last Updated**: 2026-02-04  
**Version**: 1.0

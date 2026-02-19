# eTIMS Integration - Quick Reference

## File Structure

```
Backend:
├── public/api.php                          (Add eTIMS endpoints here)
├── public/services/EtimsService.php        (Core service class)
├── sql/08-etims-tables-mysql.sql          (Database migration)

Frontend:
├── src/services/etimsService.ts            (API wrapper)
├── src/hooks/useETIMS.ts                   (Custom React hook)
├── src/pages/admin/eTIMS.tsx              (Admin page)
├── src/components/eTIMS/
│   ├── ETIMSAdminDashboard.tsx            (Main dashboard)
│   ├── ETIMSStatusBadge.tsx               (Status badge)
│   ├── ETIMSSubmitDialog.tsx              (Submit modal)
│   ├── ETIMSInvoiceActions.tsx            (Invoice actions)
│   ├── QRCodeViewer.tsx                   (QR viewer)
│   └── index.ts                            (Barrel exports)

Documentation:
├── ETIMS_SETUP_GUIDE.md                   (Complete setup guide)
├── ETIMS_QUICK_REFERENCE.md               (This file)
```

## Common Tasks

### Submit Invoice to eTIMS (Frontend)

```typescript
import { submitSaleToETIMS } from '@/services/etimsService';

const response = await submitSaleToETIMS({
  invoiceId: 123,
  companyId: 'company-uuid',
  customerName: 'John Doe',
  customerPin: 'P051658002D',
  paymentMethod: 'CASH'
});

if (response.success) {
  console.log('QR Code:', response.qr_code);
  console.log('Receipt:', response.receipt_number);
}
```

### Use eTIMS Hook (Frontend)

```typescript
import { useETIMS } from '@/hooks/useETIMS';

const { 
  submissions, 
  loading, 
  error,
  submitInvoice,
  retryFailed 
} = useETIMS();

// Submit invoice
await submitInvoice({
  invoiceId: 123,
  companyId: 'uuid',
  customerName: 'John'
});

// Retry failed
await retryFailed('company-uuid');

// Fetch submissions
await fetchSubmissions({ status: 'SYNCED' });
```

### Render Admin Dashboard

```typescript
import { ETIMSAdminDashboard } from '@/components/eTIMS';

export default function AdminPage() {
  return <ETIMSAdminDashboard />;
}
```

### Quick Invoice Actions

```typescript
import { ETIMSInvoiceActions } from '@/components/eTIMS';

<ETIMSInvoiceActions 
  invoice={invoice}
  onSubmitted={() => refresh()}
  compact={true}
/>
```

### Check eTIMS Status (PHP Backend)

```php
// In public/api.php or any PHP script
require_once 'services/EtimsService.php';

$etims = new EtimsService($conn, $env_config);
$status = $etims->getStatus();

echo json_encode($status);
```

### Submit Invoice (PHP Backend)

```php
$etims = new EtimsService($conn, $env_config);

$sale_data = [
    'invoice_number' => 'INV-001',
    'customer_name' => 'John Doe',
    'items' => [...],
    'total_amount' => 5000
];

$result = $etims->submitSale($invoice_id, $company_id, $sale_data, $user_id);

echo json_encode($result);
```

## API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api?action=etims_submit_sale` | POST | ✓ | Submit invoice to KRA |
| `/api?action=etims_retry_submissions` | POST | ✓ | Retry failed submissions |
| `/api?action=etims_status` | GET | ✗ | Check configuration status |
| `/api?action=etims_submissions_list` | GET | ✓ | List all submissions |

## Environment Variables

```env
# Core Config
ETIMS_ENV=sandbox                           # or 'production'
ETIMS_ENABLED=true

# Sandbox
ETIMS_SANDBOX_URL=https://sandbox.etims...
ETIMS_SANDBOX_TIN=12345678
ETIMS_SANDBOX_API_KEY=key
ETIMS_SANDBOX_BHF_ID=001
ETIMS_SANDBOX_VSCU_ID=001

# Production
ETIMS_PRODUCTION_URL=https://etims...
ETIMS_PRODUCTION_TIN=12345678
ETIMS_PRODUCTION_API_KEY=key
ETIMS_PRODUCTION_BHF_ID=001
ETIMS_PRODUCTION_VSCU_ID=001

# Retry Config
ETIMS_MAX_RETRIES=5
ETIMS_RETRY_DELAY_MINUTES=15
ETIMS_REQUEST_TIMEOUT_SECONDS=30
ETIMS_AUTO_RETRY=true
```

## Database Tables

### etims_sales
Stores invoice-to-eTIMS mapping with status tracking.

**Key Columns**:
- `id`: UUID
- `invoice_id`: Foreign key to invoices
- `company_id`: Foreign key to companies
- `status`: PENDING, SUBMITTED, SYNCED, FAILED, RETRYING
- `cu_invoice_number`: KRA-assigned invoice number
- `receipt_number`: KRA receipt number
- `qr_code`: Generated QR code
- `submission_count`: Number of attempts
- `next_retry_at`: Scheduled retry time

### etims_responses
Stores raw KRA API responses for auditing.

**Key Columns**:
- `id`: UUID
- `etims_sale_id`: Foreign key to etims_sales
- `http_status_code`: HTTP response code
- `response_body`: Raw JSON response
- `status`: SUCCESS, FAILED
- `response_time_ms`: API response time

### etims_sync_logs
Complete audit trail of all eTIMS operations.

**Key Columns**:
- `id`: UUID
- `company_id`: Foreign key to companies
- `etims_sale_id`: Foreign key to etims_sales
- `action`: submit, retry, success, failure
- `action_status`: completed, in_progress, error
- `log_message`: Descriptive message
- `environment`: sandbox or production
- `request_payload`: What was sent
- `response_payload`: What was received

## Status Values

| Status | Meaning |
|--------|---------|
| PENDING | Created but not submitted yet |
| SUBMITTED | Sent to KRA, waiting for response |
| SYNCED | Successfully received by KRA |
| FAILED | Submission failed, will retry |
| RETRYING | Currently attempting retry |
| ARCHIVED | Old/completed submission |

## Useful SQL Queries

### View pending submissions
```sql
SELECT * FROM etims_sales 
WHERE status IN ('PENDING', 'FAILED') 
ORDER BY created_at DESC;
```

### View successful submissions with QR codes
```sql
SELECT invoice_number, receipt_number, qr_code 
FROM etims_sales 
WHERE status = 'SYNCED';
```

### View audit trail for company
```sql
SELECT action, log_message, created_at 
FROM etims_sync_logs 
WHERE company_id = '...' 
ORDER BY created_at DESC;
```

### Check submission statistics
```sql
SELECT 
  status,
  COUNT(*) as count,
  AVG(submission_count) as avg_attempts
FROM etims_sales
GROUP BY status;
```

## Common Errors & Solutions

### "Configuration incomplete"
- Missing API key in .env
- Wrong environment (sandbox vs production)

### "Max retries exceeded"
- Check error message in audit logs
- Fix underlying issue
- Manually retry from dashboard

### "Network timeout"
- Check internet connectivity
- Verify API URL is correct
- Increase timeout in .env

### "Invoice already synced"
- Can't submit same invoice twice
- Different invoices only

## Testing

### Test Status Endpoint
```bash
curl http://localhost/api?action=etims_status
```

### Test Submit Endpoint
```bash
curl -X POST http://localhost/api?action=etims_submit_sale \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": 1,
    "companyId": "uuid",
    "customerName": "Test"
  }'
```

### Test Retry Endpoint
```bash
curl -X POST http://localhost/api?action=etims_retry_submissions \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

## Development Tips

1. **Always use localhost:3000** for frontend during development
2. **Test with sandbox first** before production
3. **Check audit logs** for detailed error messages
4. **Monitor response times** in etims_responses table
5. **Use Postman** to test endpoints before frontend
6. **Enable debug logging** in EtimsService for troubleshooting
7. **Verify JSON payloads** match KRA API spec

## Production Checklist

- [ ] Database migration executed
- [ ] .env configured with production credentials
- [ ] ETIMS_ENV=production
- [ ] SSL/TLS enabled
- [ ] CORS configured for production domain
- [ ] Rate limiting implemented
- [ ] Audit logging enabled
- [ ] Error handling in place
- [ ] Tested with real KRA API
- [ ] Monitoring/alerting configured
- [ ] Backup/recovery plan ready

## Support Resources

1. **Admin Dashboard**: `/admin/etims`
2. **Setup Guide**: `ETIMS_SETUP_GUIDE.md`
3. **Source Code**: `public/services/EtimsService.php`
4. **Database Schema**: `sql/08-etims-tables-mysql.sql`
5. **API Service**: `src/services/etimsService.ts`

---

**Last Updated**: 2026-02-04  
**Version**: 1.0

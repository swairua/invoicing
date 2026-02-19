-- =====================================================
-- eTIMS INTEGRATION TABLES - MySQL Version
-- =====================================================
-- Complete database schema for KRA e-Tax Invoice Management System (eTIMS) integration
-- Enables offline invoice submission, automatic retry mechanisms, and comprehensive audit logging
--
-- Key Principle: All eTIMS API calls occur on the PHP backend only
-- The frontend (React app) never communicates directly with KRA
--
-- Created: 2026
-- Database: MySQL 8.0+
-- Character Set: utf8mb4

-- =====================================================
-- 1. ETIMS_SALES TABLE - Invoice-to-eTIMS Mapping
-- =====================================================
-- Stores the mapping between invoices and their eTIMS submissions
-- Tracks submission status, KRA responses, and retry attempts
-- 
-- Status values:
--   PENDING: Waiting to be submitted to KRA (created but not yet sent)
--   SUBMITTED: Sent to KRA, waiting for response
--   SYNCED: Successfully synced with KRA (receipt_number received)
--   FAILED: Submission failed, may be retried
--   RETRYING: Currently in automatic retry process
--   ARCHIVED: Completed, no longer active

CREATE TABLE IF NOT EXISTS etims_sales (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()) COMMENT 'Unique identifier for eTIMS sale record',
  
  -- Company & Invoice References
  company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies table',
  invoice_id INT NOT NULL COMMENT 'Foreign key to invoices table',
  
  -- Submission Status & Tracking
  status VARCHAR(50) DEFAULT 'PENDING' COMMENT 'PENDING, SUBMITTED, SYNCED, FAILED, RETRYING, ARCHIVED',
  submission_count INT DEFAULT 0 COMMENT 'Number of submission attempts',
  last_submission_at TIMESTAMP NULL COMMENT 'Timestamp of last submission attempt',
  
  -- KRA Response Fields
  cu_invoice_number VARCHAR(255) COMMENT 'KRA-assigned invoice number (returned in successful response)',
  receipt_number VARCHAR(255) COMMENT 'KRA receipt number (returned in successful response)',
  qr_code TEXT COMMENT 'KRA-generated QR code (base64 encoded or URL)',
  
  -- Sale Payload (Stored for Retry)
  sale_payload JSON COMMENT 'Complete sale data sent to KRA (for retry purposes)',
  
  -- Error Handling & Debugging
  error_message TEXT COMMENT 'Most recent error message from KRA or system',
  error_code VARCHAR(100) COMMENT 'Error code returned by KRA API',
  http_status_code INT COMMENT 'HTTP response code from KRA API',
  
  -- Retry Scheduling
  next_retry_at TIMESTAMP NULL COMMENT 'When next automatic retry should occur',
  retry_reason TEXT COMMENT 'Reason for retry (e.g., network timeout, server error)',
  
  -- Audit Fields
  created_by CHAR(36) COMMENT 'User who created the sale record',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE KEY unique_invoice_etims (company_id, invoice_id),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Indexes for Performance
  INDEX idx_etims_sales_company_id (company_id),
  INDEX idx_etims_sales_invoice_id (invoice_id),
  INDEX idx_etims_sales_status (status),
  INDEX idx_etims_sales_creation_date (created_at DESC),
  INDEX idx_etims_sales_last_submission (last_submission_at DESC),
  INDEX idx_etims_sales_next_retry (next_retry_at),
  INDEX idx_etims_sales_cu_invoice (cu_invoice_number),
  INDEX idx_etims_sales_receipt (receipt_number),
  INDEX idx_etims_sales_status_company (company_id, status)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Maps invoices to eTIMS submissions with status tracking';

-- =====================================================
-- 2. ETIMS_RESPONSES TABLE - KRA API Responses
-- =====================================================
-- Stores raw KRA API responses for auditing and debugging
-- Preserves the complete response payload for compliance and troubleshooting

CREATE TABLE IF NOT EXISTS etims_responses (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()) COMMENT 'Unique identifier for response record',
  
  -- Link to Submission
  etims_sale_id CHAR(36) NOT NULL COMMENT 'Foreign key to etims_sales table',
  
  -- Response Details
  http_status_code INT NOT NULL COMMENT 'HTTP response code from KRA',
  response_body JSON COMMENT 'Complete raw JSON response from KRA API',
  
  -- Parsed Response Fields (for easier querying)
  status VARCHAR(50) COMMENT 'Response status from KRA (SUCCESS, FAILED, PENDING)',
  message TEXT COMMENT 'Status message from KRA',
  cu_invoice_number VARCHAR(255) COMMENT 'KRA-assigned invoice number',
  receipt_number VARCHAR(255) COMMENT 'KRA receipt number',
  qr_code TEXT COMMENT 'KRA-generated QR code',
  
  -- Response Time
  response_time_ms INT COMMENT 'Time taken by KRA API to respond (milliseconds)',
  
  -- Audit
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When response was received',
  
  -- Constraints
  FOREIGN KEY (etims_sale_id) REFERENCES etims_sales(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_etims_responses_sale_id (etims_sale_id),
  INDEX idx_etims_responses_status (status),
  INDEX idx_etims_responses_received_at (received_at DESC)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores raw KRA API responses for audit trail';

-- =====================================================
-- 3. ETIMS_SYNC_LOGS TABLE - Complete Audit Trail
-- =====================================================
-- Comprehensive log of all eTIMS operations (submit, retry, success, failure)
-- Tracks user actions, timestamps, environment, and request/response payloads
-- Used for compliance, debugging, and regulatory audit trails

CREATE TABLE IF NOT EXISTS etims_sync_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()) COMMENT 'Unique log identifier',
  
  -- Company & Sale References
  company_id CHAR(36) NOT NULL COMMENT 'Foreign key to companies table',
  etims_sale_id CHAR(36) COMMENT 'Foreign key to etims_sales (nullable for diagnostic logs)',
  
  -- Action Logging
  action VARCHAR(100) NOT NULL COMMENT 'submit, retry, success, failure, manual_retry, config_check, error',
  action_status VARCHAR(50) COMMENT 'completed, in_progress, error, skipped',
  
  -- Details
  log_message TEXT COMMENT 'Descriptive message about the action',
  log_level VARCHAR(20) COMMENT 'INFO, WARNING, ERROR, DEBUG',
  
  -- Environment Tracking
  environment VARCHAR(50) COMMENT 'sandbox or production',
  
  -- User & Authentication
  actor_user_id CHAR(36) COMMENT 'User who triggered the action (NULL for automated actions)',
  actor_role VARCHAR(50) COMMENT 'admin, super_admin, automated_retry',
  
  -- Request/Response Payloads
  request_payload JSON COMMENT 'What was sent to KRA',
  response_payload JSON COMMENT 'What KRA returned',
  
  -- Error Information
  error_code VARCHAR(100) COMMENT 'Error code if action failed',
  error_message TEXT COMMENT 'Error details if action failed',
  error_stack TEXT COMMENT 'Stack trace if available',
  
  -- Performance Metrics
  duration_ms INT COMMENT 'How long the operation took (milliseconds)',
  
  -- Audit Fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When this log entry was created',
  
  -- Constraints
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (etims_sale_id) REFERENCES etims_sales(id) ON DELETE SET NULL,
  
  -- Indexes for Fast Searching
  INDEX idx_etims_sync_logs_company_id (company_id),
  INDEX idx_etims_sync_logs_sale_id (etims_sale_id),
  INDEX idx_etims_sync_logs_action (action),
  INDEX idx_etims_sync_logs_created_at (created_at DESC),
  INDEX idx_etims_sync_logs_environment (environment),
  INDEX idx_etims_sync_logs_log_level (log_level),
  INDEX idx_etims_sync_logs_status (action_status),
  INDEX idx_etims_sync_logs_user_id (actor_user_id),
  INDEX idx_etims_sync_logs_action_company (company_id, action, created_at DESC)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Complete audit trail of all eTIMS operations';

-- =====================================================
-- 4. ADD ETIMS_SYNCED COLUMN TO INVOICES TABLE
-- =====================================================
-- Tracks whether an invoice has been synced to eTIMS
-- Prevents duplicate submissions and enables invoices to be locked after sync
-- 
-- Note: Using ALTER TABLE to add column to existing invoices table
-- If column already exists, the IF NOT EXISTS clause in the ADD COLUMN will be silently ignored

ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS etims_synced TINYINT DEFAULT 0 COMMENT 'Whether invoice has been successfully synced to KRA eTIMS',
  ADD INDEX IF NOT EXISTS idx_invoices_etims_synced (etims_synced);

-- =====================================================
-- HELPFUL QUERIES AND OPERATIONS
-- =====================================================

-- View all pending eTIMS submissions
-- SELECT 
--   es.id,
--   es.status,
--   i.invoice_number,
--   c.name as company_name,
--   es.submission_count,
--   es.last_submission_at,
--   es.error_message
-- FROM etims_sales es
-- JOIN invoices i ON es.invoice_id = i.id
-- JOIN companies c ON es.company_id = c.id
-- WHERE es.status IN ('PENDING', 'FAILED', 'RETRYING')
-- ORDER BY es.created_at DESC;

-- View submissions due for retry
-- SELECT 
--   es.id,
--   es.status,
--   i.invoice_number,
--   es.next_retry_at,
--   es.submission_count
-- FROM etims_sales es
-- JOIN invoices i ON es.invoice_id = i.id
-- WHERE es.status = 'FAILED' 
--   AND es.next_retry_at IS NOT NULL
--   AND es.next_retry_at <= NOW()
-- ORDER BY es.next_retry_at ASC;

-- View successful submissions with QR codes
-- SELECT 
--   es.id,
--   i.invoice_number,
--   es.cu_invoice_number,
--   es.receipt_number,
--   es.qr_code,
--   es.created_at
-- FROM etims_sales es
-- JOIN invoices i ON es.invoice_id = i.id
-- WHERE es.status = 'SYNCED'
-- ORDER BY es.created_at DESC
-- LIMIT 100;

-- View recent eTIMS operations
-- SELECT 
--   action,
--   COUNT(*) as count,
--   MAX(created_at) as latest
-- FROM etims_sync_logs
-- WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
-- GROUP BY action
-- ORDER BY latest DESC;

-- View configuration status
-- SELECT 
--   COUNT(DISTINCT company_id) as companies_with_etims,
--   COUNT(CASE WHEN status = 'SYNCED' THEN 1 END) as successful_submissions,
--   COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_submissions,
--   COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_submissions,
--   ROUND(AVG(submission_count), 2) as avg_submission_attempts
-- FROM etims_sales;

-- =====================================================
-- TABLE STRUCTURE VERIFICATION
-- =====================================================
-- After running this SQL, verify the tables were created:
-- 
-- SHOW TABLES LIKE 'etims_%';
-- 
-- DESCRIBE etims_sales;
-- DESCRIBE etims_responses;
-- DESCRIBE etims_sync_logs;
-- 
-- Check that invoices table has the new column:
-- DESCRIBE invoices;
-- (Look for etims_synced column)

-- =====================================================
-- END OF eTIMS MIGRATION
-- =====================================================
-- Status: Ready for Phase 1 completion
-- Next: Implement EtimsService.php (Phase 2)
-- Documentation: See plan file (.builder/plans/stellar-world-evolves.md)

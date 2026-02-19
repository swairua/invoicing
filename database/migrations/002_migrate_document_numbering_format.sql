-- MySQL Migration: Refactor document_sequences table for new numbering format
-- Changes format from TYPE-YYYY-NNNN to TYPE-DDMMYYYY-N
-- Removes year column, uses global running counter per document type

-- Step 1: Create a backup table to preserve existing data (if needed for rollback/audit)
CREATE TABLE IF NOT EXISTS `document_sequences_backup` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `document_type` CHAR(3) NOT NULL,
  `year` INT NOT NULL,
  `sequence_number` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_type_year_backup` (`document_type`, `year`),
  INDEX `idx_document_sequences_type_backup` (`document_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Backup existing data
INSERT INTO `document_sequences_backup` 
SELECT * FROM `document_sequences` 
WHERE NOT EXISTS (SELECT 1 FROM `document_sequences_backup`);

-- Step 3: Drop the old table
DROP TABLE IF EXISTS `document_sequences`;

-- Step 4: Recreate with new schema (global counter per document type)
CREATE TABLE IF NOT EXISTS `document_sequences` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `document_type` CHAR(3) NOT NULL,
  `sequence_number` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_document_type` (`document_type`),
  INDEX `idx_document_sequences_type` (`document_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 5: Initialize counters for all document types
-- Starting from 0 so the first document will be numbered 1
INSERT INTO `document_sequences` (document_type, sequence_number) VALUES
  ('INV', 0),
  ('PRO', 0),
  ('QT', 0),
  ('PO', 0),
  ('LPO', 0),
  ('DN', 0),
  ('CN', 0),
  ('PAY', 0),
  ('REC', 0),
  ('RA', 0),
  ('REM', 0)
ON DUPLICATE KEY UPDATE sequence_number = sequence_number;

-- Migration complete
-- Old format: INV-2026-0001
-- New format: INV-09022026-1

-- =====================================================
-- WEB SITE MIGRATION for fweafrmr_med (live database)
-- Run this in phpMyAdmin (SQL tab) on the LIVE database.
--
-- Adds the columns needed by the public website
-- (Laboratory / Imaging categories + items) and seeds
-- example content the admin can edit later.
--
-- SAFE TO RE-RUN IN FULL. Every statement is guarded:
-- the ALTERs check information_schema first (MySQL 8.4
-- has no IF NOT EXISTS for ADD COLUMN), CREATE TABLE uses
-- IF NOT EXISTS, seeds use INSERT IGNORE / NOT EXISTS.
-- =====================================================

-- 1) Helper: add a column only when it does not exist yet
DROP PROCEDURE IF EXISTS `add_column_if_missing`;
DELIMITER $$
CREATE PROCEDURE `add_column_if_missing`(IN p_table VARCHAR(64), IN p_column VARCHAR(64), IN p_definition TEXT)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM `information_schema`.`COLUMNS`
    WHERE `TABLE_SCHEMA` = DATABASE()
      AND `TABLE_NAME` = p_table
      AND `COLUMN_NAME` = p_column
  ) THEN
    SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_definition);
    PREPARE `stmt` FROM @ddl;
    EXECUTE `stmt`;
    DEALLOCATE PREPARE `stmt`;
  END IF;
END$$
DELIMITER ;

-- 2) Helper: add a unique key only when it does not exist yet
DROP PROCEDURE IF EXISTS `add_unique_key_if_missing`;
DELIMITER $$
CREATE PROCEDURE `add_unique_key_if_missing`(IN p_table VARCHAR(64), IN p_key VARCHAR(64), IN p_columns VARCHAR(255))
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM `information_schema`.`STATISTICS`
    WHERE `TABLE_SCHEMA` = DATABASE()
      AND `TABLE_NAME` = p_table
      AND `INDEX_NAME` = p_key
  ) THEN
    SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD UNIQUE KEY `', p_key, '` (', p_columns, ')');
    PREPARE `stmt` FROM @ddl;
    EXECUTE `stmt`;
    DEALLOCATE PREPARE `stmt`;
  END IF;
END$$
DELIMITER ;

-- 3) web_categories: icon (emoji), description, image_path, display_order, updated_at
CALL `add_column_if_missing`('web_categories', 'icon',         'VARCHAR(50) NULL DEFAULT NULL');
CALL `add_column_if_missing`('web_categories', 'description',  'TEXT NULL');
CALL `add_column_if_missing`('web_categories', 'image_path',   'VARCHAR(500) NULL DEFAULT NULL');
CALL `add_column_if_missing`('web_categories', 'display_order','INT NOT NULL DEFAULT 0');
CALL `add_column_if_missing`('web_categories', 'updated_at',   'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

-- 4) web_variants: slug (unique), description, image_path, display_order, updated_at
CALL `add_column_if_missing`('web_variants', 'slug',          'VARCHAR(255) NULL DEFAULT NULL');
CALL `add_column_if_missing`('web_variants', 'description',   'TEXT NULL');
CALL `add_column_if_missing`('web_variants', 'image_path',    'VARCHAR(500) NULL DEFAULT NULL');
CALL `add_column_if_missing`('web_variants', 'display_order', 'INT NOT NULL DEFAULT 0');
CALL `add_column_if_missing`('web_variants', 'updated_at',    'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

-- Unique slug for variant detail pages (/products/:slug).
-- Multiple NULLs are allowed by MySQL's unique index, so any
-- pre-existing rows without a slug are unaffected.
CALL `add_unique_key_if_missing`('web_variants', 'slug', '`slug`');

-- 5) Gallery images per variant
CREATE TABLE IF NOT EXISTS `variant_images` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `variant_id` INT NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `alt_text` VARCHAR(255) NULL DEFAULT NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_variant_images_variant_id` (`variant_id`),
  CONSTRAINT `fk_variant_images_variant` FOREIGN KEY (`variant_id`)
    REFERENCES `web_variants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6) Seed the two top-level categories (safe to re-run: name + slug are UNIQUE)
INSERT IGNORE INTO `web_categories` (`name`, `slug`, `icon`, `description`, `display_order`, `is_active`) VALUES
  ('Laboratory', 'laboratory', '🔬', 'Clinical laboratory testing - hematology, chemistry, microbiology and immunology services.', 1, 1),
  ('Imaging',     'imaging',     '🩻', 'Diagnostic imaging services - CT scan, X-Ray and ultrasound.', 2, 1);

-- 7) Seed example items under each category (safe to re-run: sku is UNIQUE).
--    The JOIN keeps category_id in sync with web_categories; if a category
--    row is missing, no item is inserted for it.
INSERT IGNORE INTO `web_variants` (`category_id`, `name`, `sku`, `slug`, `description`, `display_order`, `is_active`)
SELECT c.`id`, v.`name`, v.`sku`, v.`slug`, v.`description`, v.`display_order`, 1
FROM `web_categories` c
JOIN (
  SELECT 'laboratory' AS cat_slug, 'Hematology' AS `name`, 'LAB-HEM-001'  AS sku, 'hematology' AS slug, 'Blood counts, coagulation and morphology testing.'                 AS `description`, 1 AS `display_order` UNION ALL
  SELECT 'laboratory',               'Chemistry',           'LAB-CHEM-001',                 'chemistry',             'Clinical chemistry, biochemistry and therapeutic drug monitoring.'  AS `description`, 2 AS `display_order` UNION ALL
  SELECT 'laboratory',               'Microbiology',        'LAB-MICRO-001',                'microbiology',          'Culture, sensitivity and infectious disease diagnostics.'           AS `description`, 3 AS `display_order` UNION ALL
  SELECT 'laboratory',               'Immunology',          'LAB-IMM-001',                  'immunology',            'Serology, immunology and allergy testing.'                         AS `description`, 4 AS `display_order` UNION ALL
  SELECT 'imaging',                  'CT Scan',             'IMG-CT-001',                   'ct-scan',               'Computed tomography scanning for detailed cross-sectional images.' AS `description`, 1 AS `display_order` UNION ALL
  SELECT 'imaging',                  'X-Ray',               'IMG-XR-001',                   'x-ray',                 'Digital radiography for bone, chest and abdominal imaging.'        AS `description`, 2 AS `display_order` UNION ALL
  SELECT 'imaging',                  'Ultrasound',          'IMG-US-001',                   'ultrasound',            'Diagnostic ultrasound imaging including obstetric and abdominal.'  AS `description`, 3 AS `display_order`
) v ON v.`cat_slug` = c.`slug`
WHERE NOT EXISTS (
  SELECT 1 FROM `web_variants` existing WHERE existing.`sku` = v.`sku`
);

-- 8) Tidy up the helpers
DROP PROCEDURE IF EXISTS `add_column_if_missing`;
DROP PROCEDURE IF EXISTS `add_unique_key_if_missing`;

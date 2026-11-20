-- =====================================================
-- HERO_SLIDES MIGRATION for ffeafrmr_med (live database)
-- Run in phpMyAdmin (SQL tab) on the LIVE database.
-- Safe to re-run (CREATE TABLE IF NOT EXISTS + INSERT IGNORE).
-- =====================================================

-- Rotating homepage hero slides (admin-editable via Web Manager)
CREATE TABLE IF NOT EXISTS `hero_slides` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `image_url` VARCHAR(500) NOT NULL,
  `title` VARCHAR(255) NULL DEFAULT NULL,
  `subtitle` VARCHAR(500) NULL DEFAULT NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed example slides (admin edits later; re-run safe via INSERT IGNORE)
INSERT IGNORE INTO `hero_slides` (`image_url`, `title`, `subtitle`, `display_order`, `is_active`) VALUES
  ('/fallback-logo.svg',
   'Diagnostic equipment for laboratories',
   'Hematology, Chemistry, Microbiology & Immunology testing equipment.', 1, 1),
  ('/fallback-logo.svg',
   'CT, X-ray and ultrasound imaging',
   'Advanced diagnostic imaging equipment for modern healthcare.', 2, 1),
  ('/fallback-logo.svg',
   'Quality medical supplies',
   'Genuine manufacturer warranty and local technical support.', 3, 1);

-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Nov 20, 2026 at 03:24 PM
-- Server version: 8.4.6
-- PHP Version: 8.4.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `fweafrmr_med`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int NOT NULL,
  `company_id` int DEFAULT NULL,
  `actor_user_id` int DEFAULT NULL,
  `action` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `company_id`, `actor_user_id`, `action`, `entity_type`, `record_id`, `created_at`) VALUES
(1, 1, 1, 'DELETE', 'quotation', 2, '2026-09-05 10:16:42'),
(2, 1, 1, 'DELETE', 'quotation', 1, '2026-09-05 10:16:48'),
(3, 1, 1, 'DELETE', 'quotation', 6, '2026-10-10 06:01:25'),
(4, 1, 1, 'DELETE', 'quotation', 7, '2026-10-10 06:03:59'),
(5, 1, 1, 'DELETE', 'quotation', 4, '2026-10-10 06:04:26'),
(6, 1, 1, 'DELETE', 'quotation', 10, '2026-11-02 16:47:23'),
(7, 1, 1, 'DELETE', 'quotation', 11, '2026-11-04 15:49:37'),
(8, 1, 1, 'GENERATE', 'statement', 4, '2026-11-19 08:39:08');

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `registration_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postal_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fiscal_year_start` int DEFAULT '1',
  `currency` varchar(3) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'USD',
  `website` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `primary_color` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '#FF8C42',
  `pdf_template` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'default',
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `pdf_footer_line1` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `pdf_footer_line2` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `pdf_footer_enabled_docs` json DEFAULT (json_array()),
  `pdf_background_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `pdf_background_opacity` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '100'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`id`, `name`, `registration_number`, `tax_number`, `email`, `phone`, `address`, `city`, `state`, `postal_code`, `country`, `fiscal_year_start`, `currency`, `website`, `logo_url`, `primary_color`, `pdf_template`, `status`, `created_at`, `updated_at`, `pdf_footer_line1`, `pdf_footer_line2`, `pdf_footer_enabled_docs`, `pdf_background_image`, `pdf_background_opacity`) VALUES
(1, 'Diag Solutions Ltd', NULL, NULL, 'info@diagsolutionsltd.com', 'Tel: +254 180 274401', 'Naivasha Road, Kamrose Plaza, 1st Flr, Rm 14', 'Nairobi', '', '', 'Kenya', 6, 'KES', 'https://diagsolutionsltd.com', 'https://diagsolutionsltd.com/uploads/ChatGPT_Image_Sep_2__2026__09_04_45_PM-1788373437.png', '#FF8C42', 'default', 'active', '2026-01-17 13:08:46', '2026-11-19 07:06:13', 'Account Details Bank: Cooperative Bank Bank name: Diag Solutions Limited Account No: 01103390021001', 'Mpesa PAYBILL NO: 400200 Account No: 01103390021001', '[\"invoice\", \"proforma\", \"statement\", \"receipt\", \"quotation\", \"remittance\"]', 'https://diagsolutionsltd.com/uploads/WhatsApp_Image_2026-11-19_at_10.03.15_AM-1795071973.jpeg', '100');

-- --------------------------------------------------------

--
-- Table structure for table `contacts`
--

CREATE TABLE `contacts` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `credit_notes`
--

CREATE TABLE `credit_notes` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `invoice_id` int DEFAULT NULL,
  `credit_note_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_amount` decimal(15,2) DEFAULT '0.00',
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `credit_note_allocations`
--

CREATE TABLE `credit_note_allocations` (
  `id` int NOT NULL,
  `credit_note_id` int NOT NULL,
  `invoice_id` int NOT NULL,
  `allocated_amount` decimal(15,2) DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `credit_note_items`
--

CREATE TABLE `credit_note_items` (
  `id` int NOT NULL,
  `credit_note_id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(10,3) DEFAULT '1.000',
  `unit_price` decimal(15,2) DEFAULT '0.00',
  `line_total` decimal(15,2) DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postal_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `credit_limit` decimal(15,2) DEFAULT '0.00',
  `is_supplier` tinyint(1) DEFAULT '0',
  `payment_terms` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `company_id`, `name`, `email`, `phone`, `address`, `city`, `state`, `postal_code`, `country`, `tax_id`, `customer_number`, `status`, `credit_limit`, `is_supplier`, `payment_terms`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'Umoja Three Medical Centre', '', '+254704373727', 'Umoja three', '', NULL, NULL, 'Kenya', NULL, NULL, 'active', 20000.00, 0, '0', '1', '2026-09-02 08:52:38', '2026-09-02 08:52:38'),
(2, 1, 'Kegogi Medicare Hospital', '', '0703501747', 'Kegogi - Kisii', 'Kisii', NULL, NULL, 'Kenya', NULL, NULL, 'active', 100000.00, 0, '0', '1', '2026-09-05 10:16:22', '2026-09-05 10:16:22'),
(3, 1, 'Quintas Medical Centre Limited', '', '+254728926474', 'Mosocho-Kisii', 'Kisii', NULL, NULL, 'Kenya', NULL, NULL, 'active', 100000.00, 0, '0', '1', '2026-10-09 16:42:42', '2026-10-09 16:42:42'),
(4, 1, 'Aster Point Hospital Ltd', '', '0710411257', 'Nazra Gardens', '', NULL, NULL, 'Kenya', NULL, NULL, 'active', 100000.00, 0, '0', '1', '2026-10-13 10:08:36', '2026-10-13 10:08:36'),
(5, 1, 'Kishan Medical Specialists Center Nanyuki', 'nanyukispecialists2024@gmail.com', '0700760822', 'Nanyuki', 'Nanyuki', NULL, NULL, 'Kenya', NULL, NULL, 'active', 50000.00, 0, '14', '1', '2026-10-16 09:25:37', '2026-10-16 09:25:37'),
(6, 1, 'Bethany Hill Crest Hospital', '', '0722249171', 'Kiamunyi, Nakuru', 'Nakuru', NULL, NULL, 'Kenya', NULL, NULL, 'active', 100000.00, 0, '0', '1', '2026-10-19 09:03:14', '2026-10-19 09:03:14'),
(7, 1, 'Jamhuri Medical and Laboratory Services', '', '+254722337608', 'Ngong Road, Opposite Green House', 'Nairobi', NULL, NULL, 'Kenya', NULL, NULL, 'active', 100000.00, 0, '0', '1', '2026-11-02 16:46:46', '2026-11-02 16:46:46'),
(8, 1, 'Egesa Medical Centre', '', '0707223209', 'Egesa shopping Centre, Kisii', 'Kisii', NULL, NULL, 'Kenya', NULL, NULL, 'active', 100000.00, 0, '0', '1', '2026-11-17 13:24:03', '2026-11-17 13:24:03'),
(9, 1, 'Gichuki Simon', 'gichukisimon@gmail.com', '+254722241745', 'Fgt', 'Nairobi', NULL, NULL, 'Kenya', NULL, NULL, 'active', 100000.00, 0, '0', '1', '2026-11-19 07:28:00', '2026-11-19 07:28:00');

-- --------------------------------------------------------

--
-- Table structure for table `delivery_notes`
--

CREATE TABLE `delivery_notes` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `invoice_id` int DEFAULT NULL,
  `delivery_note_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivery_date` date DEFAULT (curdate()),
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_note_items`
--

CREATE TABLE `delivery_note_items` (
  `id` int NOT NULL,
  `delivery_note_id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(10,3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `discovery_leads`
--

CREATE TABLE `discovery_leads` (
  `id` int NOT NULL,
  `business_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `document_sequences`
--

CREATE TABLE `document_sequences` (
  `id` int NOT NULL,
  `document_type` char(3) NOT NULL,
  `year` int NOT NULL,
  `sequence_number` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `document_sequences`
--

INSERT INTO `document_sequences` (`id`, `document_type`, `year`, `sequence_number`, `created_at`, `updated_at`) VALUES
(1, 'PRO', 2026, 5, '2026-01-26 12:09:03', '2026-07-10 09:36:17'),
(4, 'INV', 2026, 26, '2026-01-26 12:24:59', '2026-11-19 07:39:11'),
(5, 'QT', 2026, 23, '2026-01-26 12:24:59', '2026-11-17 13:37:06'),
(6, 'PO', 2026, 0, '2026-01-26 12:24:59', '2026-01-26 12:24:59'),
(7, 'LPO', 2026, 0, '2026-01-26 12:25:00', '2026-01-26 12:25:00'),
(8, 'DN', 2026, 2, '2026-01-26 12:25:00', '2026-11-17 19:31:33'),
(9, 'CN', 2026, 0, '2026-01-26 12:25:00', '2026-01-26 12:25:00'),
(10, 'PAY', 2026, 22, '2026-01-26 12:25:00', '2026-11-19 08:33:46'),
(11, 'REC', 2026, 6, '2026-01-26 12:25:00', '2026-01-27 08:33:52');

-- --------------------------------------------------------

--
-- Table structure for table `drivers`
--

CREATE TABLE `drivers` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `name` varchar(150) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `license_number` varchar(50) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `quotation_id` int DEFAULT NULL,
  `invoice_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_date` date DEFAULT (curdate()),
  `due_date` date DEFAULT NULL,
  `subtotal` decimal(15,2) DEFAULT '0.00',
  `tax_amount` decimal(15,2) DEFAULT '0.00',
  `total_amount` decimal(15,2) DEFAULT '0.00',
  `paid_amount` decimal(15,2) DEFAULT '0.00',
  `balance_due` decimal(15,2) DEFAULT '0.00',
  `lpo_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `terms_and_conditions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` (`id`, `company_id`, `customer_id`, `quotation_id`, `invoice_number`, `invoice_date`, `due_date`, `subtotal`, `tax_amount`, `total_amount`, `paid_amount`, `balance_due`, `lpo_number`, `status`, `created_by`, `created_at`, `updated_at`, `notes`, `terms_and_conditions`) VALUES
(5, 1, 1, NULL, 'INV-12102026-19', '2026-10-12', '2026-11-11', 6500.00, 0.00, 6500.00, 0.00, 6500.00, NULL, 'draft', 1, '2026-10-12 10:13:04', '2026-10-12 10:13:04', '', ''),
(6, 1, 2, NULL, 'INV-12102026-20', '2026-10-12', '2026-11-11', 554500.00, 88720.00, 643220.00, 0.00, 643220.00, NULL, 'draft', 1, '2026-10-12 17:16:33', '2026-10-12 17:16:33', '', ''),
(7, 1, 4, NULL, 'INV-13102026-21', '2026-10-13', '2026-11-12', 3800.00, 0.00, 3800.00, 0.00, 0.00, NULL, 'draft', 1, '2026-10-13 20:53:45', '2026-11-19 08:33:47', NULL, NULL),
(8, 1, 5, NULL, 'INV-20102026-22', '2026-10-20', '2026-11-19', 4800.00, 0.00, 4800.00, 0.00, 0.00, NULL, 'draft', 1, '2026-10-20 16:39:51', '2026-11-19 08:33:36', NULL, NULL),
(9, 1, 7, NULL, 'INV-06112026-23', '2026-11-06', '2026-12-06', 44450.00, 0.00, 44450.00, 0.00, 0.00, '', 'draft', 1, '2026-11-06 08:45:52', '2026-11-19 08:33:13', '', ''),
(10, 1, 7, NULL, 'INV-06112026-24', '2026-11-06', '2026-12-06', 60000.00, 0.00, 60000.00, 0.00, 0.00, NULL, 'draft', 1, '2026-11-06 09:56:08', '2026-11-19 08:33:25', '', ''),
(11, 1, 8, NULL, 'INV-17112026-25', '2026-11-17', '2026-12-17', 15450.00, 0.00, 15450.00, 0.00, 0.00, NULL, 'draft', 1, '2026-11-17 19:30:48', '2026-11-19 08:32:55', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `invoice_items`
--

CREATE TABLE `invoice_items` (
  `id` int NOT NULL,
  `invoice_id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(10,3) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `tax_percentage` decimal(5,2) DEFAULT '0.00',
  `tax_amount` decimal(15,2) DEFAULT '0.00',
  `tax_inclusive` tinyint(1) DEFAULT '0',
  `tax_setting_id` int DEFAULT NULL,
  `line_total` decimal(15,2) NOT NULL,
  `sort_order` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `invoice_items`
--

INSERT INTO `invoice_items` (`id`, `invoice_id`, `product_id`, `description`, `quantity`, `unit_price`, `tax_percentage`, `tax_amount`, `tax_inclusive`, `tax_setting_id`, `line_total`, `sort_order`) VALUES
(6, 5, 1, 'Diluent', 1.000, 6500.00, 0.00, 0.00, 0, NULL, 6500.00, 1),
(7, 6, 6, 'Patient Stretcher', 1.000, 35000.00, 16.00, 5600.00, 0, NULL, 40600.00, 1),
(8, 6, 5, 'Oxygen Concentrator (10L)', 1.000, 100000.00, 16.00, 16000.00, 0, NULL, 116000.00, 2),
(9, 6, 7, 'Autoclave (50Litres)', 1.000, 180000.00, 16.00, 28800.00, 0, NULL, 208800.00, 3),
(10, 6, 8, 'Single Arm Operating Theatre Light', 1.000, 210000.00, 16.00, 33600.00, 0, NULL, 243600.00, 4),
(11, 6, 9, 'Mayo Trolley', 1.000, 9000.00, 16.00, 1440.00, 0, NULL, 10440.00, 5),
(12, 6, 10, 'Suction machine (Two bottle)', 1.000, 20500.00, 16.00, 3280.00, 0, NULL, 23780.00, 6),
(13, 7, 34, 'Magnesium', 1.000, 3800.00, 0.00, 0.00, 0, NULL, 3800.00, 1),
(14, 8, 35, 'Brucella reagent', 1.000, 1500.00, 0.00, 0.00, 0, NULL, 1500.00, 1),
(15, 8, 36, 'Antisera (Anti A,B & D)', 1.000, 1600.00, 0.00, 0.00, 0, NULL, 1600.00, 2),
(16, 8, 37, 'Microtainers EDTA tubes', 1.000, 1500.00, 0.00, 0.00, 0, NULL, 1500.00, 3),
(17, 8, 38, 'Shipping charges', 1.000, 200.00, 0.00, 0.00, 0, NULL, 200.00, 4),
(55, 9, 45, 'Scissors (curved)', 5.000, 500.00, 0.00, 0.00, 1, NULL, 2500.00, 1),
(56, 9, 46, 'Scissors (straight)', 5.000, 500.00, 0.00, 0.00, 1, NULL, 2500.00, 2),
(57, 9, 47, 'Scalpel holder (No.4)', 5.000, 300.00, 0.00, 0.00, 1, NULL, 1500.00, 3),
(58, 9, 48, 'Adson Forceps (Toothed)', 5.000, 450.00, 0.00, 0.00, 1, NULL, 2250.00, 4),
(59, 9, 49, 'Adson Forceps (non-toothed)', 5.000, 450.00, 0.00, 0.00, 1, NULL, 2250.00, 5),
(60, 9, 50, 'Artery Forceps (curved)', 5.000, 600.00, 0.00, 0.00, 1, NULL, 3000.00, 6),
(61, 9, 51, 'Artery forceps (straight)', 5.000, 600.00, 0.00, 0.00, 1, NULL, 3000.00, 7),
(62, 9, 52, 'Mosquito forceps', 5.000, 450.00, 0.00, 0.00, 1, NULL, 2250.00, 8),
(63, 9, 53, 'Kidney dish', 5.000, 500.00, 0.00, 0.00, 1, NULL, 2500.00, 9),
(64, 9, 54, 'Sponge Holding Forceps', 5.000, 1000.00, 0.00, 0.00, 1, NULL, 5000.00, 10),
(65, 9, 55, 'Gallipots', 5.000, 300.00, 0.00, 0.00, 1, NULL, 1500.00, 11),
(66, 9, 62, 'Tray receiver with cover', 5.000, 1800.00, 0.00, 0.00, 1, NULL, 9000.00, 12),
(67, 9, 64, 'Storage drum 30', 1.000, 3500.00, 0.00, 0.00, 1, NULL, 3500.00, 13),
(68, 9, 65, 'Surgical Sutures (Absorbable- vicyryl 2-0)', 1.000, 1300.00, 0.00, 0.00, 1, NULL, 1300.00, 14),
(69, 9, 66, 'Surgical Sutures (Absorbable- vicyryl 3-0)', 1.000, 1300.00, 0.00, 0.00, 1, NULL, 1300.00, 15),
(70, 9, 67, 'Surgical sutures (Non-absorbable nylon 2-0)', 1.000, 550.00, 0.00, 0.00, 1, NULL, 550.00, 16),
(71, 9, 68, 'Surgical sutures (Non-absorbable nylon 3-0)', 1.000, 550.00, 0.00, 0.00, 1, NULL, 550.00, 17),
(72, 10, 70, 'Patient Monitor (5 Parameters)', 1.000, 60000.00, 0.00, 0.00, 0, NULL, 60000.00, 1),
(73, 11, 77, 'ESR Fast Detector', 1.000, 5000.00, 0.00, 0.00, 0, NULL, 5000.00, 1),
(74, 11, 79, 'ESR Fast Detector Tubes (100pcs)', 1.000, 2500.00, 0.00, 0.00, 0, NULL, 2500.00, 2),
(75, 11, 80, 'Hemocue 301 strips', 1.000, 3500.00, 0.00, 0.00, 0, NULL, 3500.00, 3),
(76, 11, 81, 'Stepping stool', 1.000, 3500.00, 0.00, 0.00, 0, NULL, 3500.00, 4),
(77, 11, 82, 'Patella hammer', 1.000, 500.00, 0.00, 0.00, 0, NULL, 500.00, 5),
(78, 11, 85, 'Medical Pen Torch', 1.000, 300.00, 0.00, 0.00, 0, NULL, 300.00, 6),
(79, 11, 86, 'Muac tape', 1.000, 150.00, 0.00, 0.00, 0, NULL, 150.00, 7);

-- --------------------------------------------------------

--
-- Table structure for table `leads`
--

CREATE TABLE `leads` (
  `id` int NOT NULL,
  `business_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_person` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `logs`
--

CREATE TABLE `logs` (
  `id` int NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `level` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lpos`
--

CREATE TABLE `lpos` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `supplier_id` int DEFAULT NULL,
  `lpo_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_amount` decimal(15,2) DEFAULT '0.00',
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lpo_items`
--

CREATE TABLE `lpo_items` (
  `id` int NOT NULL,
  `lpo_id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(10,3) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `line_total` decimal(15,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `materials`
--

CREATE TABLE `materials` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text,
  `unit` varchar(20) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migration_logs`
--

CREATE TABLE `migration_logs` (
  `id` int NOT NULL,
  `migration_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `executed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `newsletter`
--

CREATE TABLE `newsletter` (
  `id` int NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `opportunities`
--

CREATE TABLE `opportunities` (
  `id` int NOT NULL,
  `source` varchar(2048) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `snippet` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `invoice_id` int DEFAULT NULL,
  `payment_date` date DEFAULT (curdate()),
  `payment_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `reference_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `customer_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `company_id`, `invoice_id`, `payment_date`, `payment_method`, `amount`, `reference_number`, `created_by`, `created_at`, `customer_id`, `payment_number`, `notes`) VALUES
(1, 1, 7, '2026-10-13', 'MPESA', 3800.00, 'UJDQJA959W', NULL, '2026-10-13 20:56:29', NULL, 'PAY-13102026-6', NULL),
(2, 1, 7, '2026-10-20', 'MPESA', 3800.00, 'PAY-20102026-7', NULL, '2026-10-20 16:38:41', NULL, 'PAY-20102026-7', NULL),
(3, 1, 9, '2026-11-06', 'MPESA', 44450.00, 'PAY-06112026-8', NULL, '2026-11-06 09:51:44', NULL, 'PAY-06112026-8', NULL),
(4, 1, 7, '2026-11-06', 'MPESA', 3800.00, 'PAY-06112026-9', NULL, '2026-11-06 09:53:53', NULL, 'PAY-06112026-9', NULL),
(5, 1, 9, '2026-11-12', 'MPESA', 44450.00, 'PAY-12112026-10', NULL, '2026-11-12 07:18:23', NULL, 'PAY-12112026-10', NULL),
(6, 1, 10, '2026-11-12', 'MPESA', 60000.00, 'PAY-12112026-11', NULL, '2026-11-12 07:18:50', NULL, 'PAY-12112026-11', NULL),
(7, 1, 8, '2026-11-12', 'BANK', 4800.00, 'PAY-12112026-12', NULL, '2026-11-12 07:19:35', NULL, 'PAY-12112026-12', NULL),
(8, 1, 7, '2026-11-12', 'MPESA', 3800.00, 'PAY-12112026-13', NULL, '2026-11-12 07:19:49', NULL, 'PAY-12112026-13', NULL),
(9, 1, 11, '2026-11-17', 'MPESA', 15450.00, 'PAY-17112026-14', NULL, '2026-11-17 19:32:00', NULL, 'PAY-17112026-14', NULL),
(10, 1, 9, '2026-11-17', 'MPESA', 44450.00, 'PAY-17112026-15', NULL, '2026-11-17 19:32:30', NULL, 'PAY-17112026-15', NULL),
(11, 1, 10, '2026-11-17', 'MPESA', 60000.00, 'PAY-17112026-16', NULL, '2026-11-17 19:32:45', NULL, 'PAY-17112026-16', NULL),
(13, 1, 11, '2026-11-19', 'MPESA', 15450.00, 'PAY-19112026-18', NULL, '2026-11-19 08:32:54', '8', 'PAY-19112026-18', NULL),
(14, 1, 9, '2026-11-19', 'MPESA', 44450.00, 'PAY-19112026-19', NULL, '2026-11-19 08:33:12', '7', 'PAY-19112026-19', NULL),
(15, 1, 10, '2026-11-19', 'MPESA', 60000.00, 'PAY-19112026-20', NULL, '2026-11-19 08:33:24', '7', 'PAY-19112026-20', NULL),
(16, 1, 8, '2026-11-19', 'MPESA', 4800.00, 'PAY-19112026-21', NULL, '2026-11-19 08:33:35', '5', 'PAY-19112026-21', NULL),
(17, 1, 7, '2026-11-19', 'MPESA', 3800.00, 'PAY-19112026-22', NULL, '2026-11-19 08:33:46', '4', 'PAY-19112026-22', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `payment_allocations`
--

CREATE TABLE `payment_allocations` (
  `id` int NOT NULL,
  `payment_id` int NOT NULL,
  `invoice_id` int NOT NULL,
  `amount` decimal(15,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_allocations`
--

INSERT INTO `payment_allocations` (`id`, `payment_id`, `invoice_id`, `amount`) VALUES
(1, 1, 7, 3800.00),
(2, 2, 7, 3800.00),
(3, 3, 9, 44450.00),
(4, 4, 7, 3800.00),
(5, 5, 9, 44450.00),
(6, 6, 10, 60000.00),
(7, 7, 8, 4800.00),
(8, 8, 7, 3800.00),
(9, 9, 11, 15450.00),
(10, 10, 9, 44450.00),
(11, 11, 10, 60000.00),
(13, 13, 11, 15450.00),
(14, 14, 9, 44450.00),
(15, 15, 10, 60000.00),
(16, 16, 8, 4800.00),
(17, 17, 7, 3800.00);

-- --------------------------------------------------------

--
-- Table structure for table `payment_audit_log`
--

CREATE TABLE `payment_audit_log` (
  `id` int NOT NULL,
  `action` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_id` int NOT NULL,
  `invoice_id` int NOT NULL,
  `payment_amount` decimal(15,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_methods`
--

CREATE TABLE `payment_methods` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_methods`
--

INSERT INTO `payment_methods` (`id`, `company_id`, `name`, `code`, `is_active`, `created_at`) VALUES
(1, 1, 'Mpesa', 'MPESA', 1, '2026-01-18 07:14:39'),
(4, 1, 'Bank', 'BANK', 1, '2026-05-11 07:55:09');

-- --------------------------------------------------------

--
-- Table structure for table `portfolios`
--

CREATE TABLE `portfolios` (
  `id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `category_id` int DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `sku` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_of_measure` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stock_quantity` decimal(10,3) DEFAULT '0.000',
  `reorder_level` decimal(10,3) DEFAULT '0.000',
  `unit_price` decimal(15,2) NOT NULL,
  `cost_price` decimal(15,2) DEFAULT '0.00',
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `company_id`, `category_id`, `name`, `description`, `sku`, `unit_of_measure`, `stock_quantity`, `reorder_level`, `unit_price`, `cost_price`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, 'Diluent', NULL, NULL, NULL, 0.000, 0.000, 6500.00, 0.00, 'active', '2026-09-02 08:56:27', '2026-09-02 08:56:27'),
(2, 1, NULL, 'Diluent', 'Hti', NULL, NULL, 0.000, 0.000, 6000.00, 0.00, 'active', '2026-09-03 15:26:31', '2026-09-03 15:26:31'),
(3, 1, NULL, 'Hydralic Operating Table', NULL, NULL, NULL, 0.000, 0.000, 250000.00, 0.00, 'active', '2026-09-05 10:20:12', '2026-09-05 10:20:12'),
(4, 1, NULL, 'Patient Monitor (5 Parameters)', NULL, NULL, NULL, 0.000, 0.000, 60000.00, 0.00, 'active', '2026-09-05 10:21:57', '2026-09-05 10:21:57'),
(5, 1, NULL, 'Oxygen Concentrator (10L)', NULL, NULL, NULL, 0.000, 0.000, 100000.00, 0.00, 'active', '2026-09-05 10:23:04', '2026-09-05 10:23:04'),
(6, 1, NULL, 'Patient Stretcher', NULL, NULL, NULL, 0.000, 0.000, 35000.00, 0.00, 'active', '2026-09-05 10:23:47', '2026-09-05 10:23:47'),
(7, 1, NULL, 'Autoclave (50Litres)', NULL, NULL, NULL, 0.000, 0.000, 180000.00, 0.00, 'active', '2026-09-05 17:22:58', '2026-09-05 17:22:58'),
(8, 1, NULL, 'Single Arm Operating Theatre Light', NULL, NULL, NULL, 0.000, 0.000, 210000.00, 0.00, 'active', '2026-09-05 17:24:56', '2026-09-05 17:24:56'),
(9, 1, NULL, 'Mayo Trolley', NULL, NULL, NULL, 0.000, 0.000, 9000.00, 0.00, 'active', '2026-09-05 17:25:59', '2026-09-05 17:25:59'),
(10, 1, NULL, 'Suction machine (Two bottle)', NULL, NULL, NULL, 0.000, 0.000, 20500.00, 0.00, 'active', '2026-09-05 17:30:35', '2026-09-05 17:30:35'),
(11, 1, NULL, 'Standard Wheelchair', NULL, NULL, NULL, 0.000, 0.000, 10000.00, 0.00, 'active', '2026-09-05 17:31:25', '2026-09-05 17:31:25'),
(12, 1, NULL, 'Drip Stand', NULL, NULL, NULL, 0.000, 0.000, 3500.00, 0.00, 'active', '2026-09-05 17:32:18', '2026-09-05 17:32:18'),
(13, 1, NULL, 'Ambubag', NULL, NULL, NULL, 0.000, 0.000, 3000.00, 0.00, 'active', '2026-09-05 17:32:50', '2026-09-05 17:32:50'),
(14, 1, NULL, 'Fetal Doppler', NULL, NULL, NULL, 0.000, 0.000, 8500.00, 0.00, 'active', '2026-09-05 17:33:31', '2026-09-05 17:33:31'),
(15, 1, NULL, 'Digital Scale Baby', NULL, NULL, NULL, 0.000, 0.000, 6000.00, 0.00, 'active', '2026-09-05 17:34:35', '2026-09-05 17:34:35'),
(16, 1, NULL, 'Diathermy Machine', NULL, NULL, NULL, 0.000, 0.000, 180000.00, 0.00, 'active', '2026-09-05 17:35:28', '2026-09-05 17:35:28'),
(17, 1, NULL, 'Complete Dental Unit', NULL, NULL, NULL, 0.000, 0.000, 350000.00, 0.00, 'active', '2026-09-05 17:36:13', '2026-09-05 17:36:13'),
(18, 1, NULL, 'Radiant Baby Warmer', NULL, NULL, NULL, 0.000, 0.000, 210000.00, 0.00, 'active', '2026-09-08 04:50:28', '2026-09-08 04:50:28'),
(19, 1, NULL, 'Laryngoscope', NULL, NULL, NULL, 0.000, 0.000, 195000.00, 0.00, 'active', '2026-09-08 04:52:37', '2026-09-08 04:52:37'),
(20, 1, NULL, 'Laryngoscope Blades', NULL, NULL, NULL, 0.000, 0.000, 16000.00, 0.00, 'active', '2026-09-08 04:53:17', '2026-09-08 04:53:17'),
(21, 1, NULL, 'Oxygen Concentrator (10L)', NULL, NULL, NULL, 0.000, 0.000, 100000.00, 0.00, 'active', '2026-09-08 06:33:28', '2026-09-08 06:33:28'),
(22, 1, NULL, 'Oxygen Concentrator (10L)', NULL, NULL, NULL, 0.000, 0.000, 100000.00, 0.00, 'active', '2026-09-08 06:35:14', '2026-09-08 06:35:14'),
(23, 1, NULL, 'Drip Stand', NULL, NULL, NULL, 0.000, 0.000, 3250.00, 0.00, 'active', '2026-09-08 06:45:24', '2026-09-08 06:45:24'),
(24, 1, NULL, 'Diathermy Machine (400W)', NULL, NULL, NULL, 0.000, 0.000, 185000.00, 0.00, 'active', '2026-09-08 06:47:28', '2026-09-08 06:47:28'),
(25, 1, NULL, 'Autoclave (50Litres)', NULL, NULL, NULL, 0.000, 0.000, 185000.00, 0.00, 'active', '2026-09-08 06:49:01', '2026-09-08 06:49:01'),
(26, 1, NULL, 'Laryngoscope Blades (4 Blades)', NULL, NULL, NULL, 0.000, 0.000, 8000.00, 0.00, 'active', '2026-09-08 06:50:12', '2026-09-08 06:50:12'),
(27, 1, NULL, 'Drip Stand', NULL, NULL, NULL, 0.000, 0.000, 2000.00, 0.00, 'active', '2026-10-07 03:20:23', '2026-10-07 03:20:23'),
(28, 1, NULL, 'Anbio Immunoassay analyzer (AIA)', 'IA', NULL, NULL, 0.000, 0.000, 100000.00, 0.00, 'active', '2026-10-09 16:46:56', '2026-10-09 16:46:56'),
(29, 1, NULL, 'HbA1c Test Kit', 'Test kits', NULL, NULL, 0.000, 0.000, 100000.00, 0.00, 'active', '2026-10-09 16:53:47', '2026-10-09 16:53:47'),
(30, 1, NULL, 'Anbio Immunoassay analyzer (AIA)', NULL, NULL, NULL, 0.000, 0.000, 100000.00, 0.00, 'active', '2026-10-09 16:59:34', '2026-10-09 16:59:34'),
(31, 1, NULL, 'HbA1c test kit', NULL, NULL, NULL, 0.000, 0.000, 12000.00, 0.00, 'active', '2026-10-09 17:01:01', '2026-10-09 17:01:01'),
(32, 1, NULL, 'HbA1c test kit', NULL, NULL, NULL, 0.000, 0.000, 12000.00, 0.00, 'active', '2026-10-10 05:51:04', '2026-10-10 05:51:04'),
(33, 1, NULL, 'HbA1c test kit', NULL, NULL, NULL, 0.000, 0.000, 12000.00, 0.00, 'active', '2026-10-10 06:02:21', '2026-10-10 06:02:21'),
(34, 1, NULL, 'Magnesium', NULL, NULL, NULL, 0.000, 0.000, 3800.00, 0.00, 'active', '2026-10-13 10:11:35', '2026-10-13 10:11:35'),
(35, 1, NULL, 'Brucella reagent', NULL, NULL, NULL, 0.000, 0.000, 1500.00, 0.00, 'active', '2026-10-16 11:52:18', '2026-10-16 11:52:18'),
(36, 1, NULL, 'Antisera (Anti A,B & D)', NULL, NULL, NULL, 0.000, 0.000, 1600.00, 0.00, 'active', '2026-10-16 11:54:11', '2026-10-16 11:54:11'),
(37, 1, NULL, 'Microtainers EDTA tubes', NULL, NULL, NULL, 0.000, 0.000, 1500.00, 0.00, 'active', '2026-10-16 11:58:35', '2026-10-16 11:58:35'),
(38, 1, NULL, 'Shipping charges', NULL, NULL, NULL, 0.000, 0.000, 200.00, 0.00, 'active', '2026-10-16 12:01:15', '2026-10-16 12:01:15'),
(39, 1, NULL, 'Microscope BN107', NULL, NULL, NULL, 0.000, 0.000, 25000.00, 0.00, 'active', '2026-10-19 09:05:31', '2026-10-19 09:05:31'),
(40, 1, NULL, 'Centrifuge 6 tubes', NULL, NULL, NULL, 0.000, 0.000, 8500.00, 0.00, 'active', '2026-10-19 09:06:39', '2026-10-19 09:06:39'),
(41, 1, NULL, 'Microscope BN107', NULL, NULL, NULL, 0.000, 0.000, 2500.00, 0.00, 'active', '2026-10-19 09:07:39', '2026-10-19 09:07:39'),
(42, 1, NULL, 'Microscope BN107', NULL, NULL, NULL, 0.000, 0.000, 25000.00, 0.00, 'active', '2026-10-19 09:08:05', '2026-10-19 09:08:05'),
(43, 1, NULL, 'Centrifuge 6 tubes', NULL, NULL, NULL, 0.000, 0.000, 8500.00, 0.00, 'active', '2026-10-19 09:09:02', '2026-10-19 09:09:02'),
(44, 1, NULL, 'PM12B Multi-Parameter Patient Monitor (LE MEDICAL)', NULL, NULL, NULL, 0.000, 0.000, 60000.00, 0.00, 'active', '2026-11-02 16:55:28', '2026-11-02 16:55:28'),
(45, 1, NULL, 'Scissors (curved)', NULL, NULL, NULL, 0.000, 0.000, 450.00, 0.00, 'active', '2026-11-03 10:23:47', '2026-11-03 10:23:47'),
(46, 1, NULL, 'Scissors (straight)', NULL, NULL, NULL, 0.000, 0.000, 450.00, 0.00, 'active', '2026-11-03 10:24:26', '2026-11-03 10:24:26'),
(47, 1, NULL, 'Scalpel holder (No.4)', NULL, NULL, NULL, 0.000, 0.000, 269.96, 0.00, 'active', '2026-11-03 10:25:35', '2026-11-03 10:25:35'),
(48, 1, NULL, 'Adson Forceps (Toothed)', NULL, NULL, NULL, 0.000, 0.000, 450.00, 0.00, 'active', '2026-11-03 10:27:03', '2026-11-03 10:27:03'),
(49, 1, NULL, 'Adson Forceps (non-toothed)', NULL, NULL, NULL, 0.000, 0.000, 400.00, 0.00, 'active', '2026-11-03 10:27:44', '2026-11-03 10:27:44'),
(50, 1, NULL, 'Artery Forceps (curved)', NULL, NULL, NULL, 0.000, 0.000, 500.00, 0.00, 'active', '2026-11-03 10:28:24', '2026-11-03 10:28:24'),
(51, 1, NULL, 'Artery forceps (straight)', NULL, NULL, NULL, 0.000, 0.000, 500.00, 0.00, 'active', '2026-11-03 10:29:00', '2026-11-03 10:29:00'),
(52, 1, NULL, 'Mosquito forceps', NULL, NULL, NULL, 0.000, 0.000, 449.99, 0.00, 'active', '2026-11-03 10:30:26', '2026-11-03 10:30:26'),
(53, 1, NULL, 'Kidney dish', NULL, NULL, NULL, 0.000, 0.000, 500.00, 0.00, 'active', '2026-11-03 10:31:14', '2026-11-03 10:31:14'),
(54, 1, NULL, 'Sponge Holding Forceps', NULL, NULL, NULL, 0.000, 0.000, 1000.00, 0.00, 'active', '2026-11-03 10:31:46', '2026-11-03 10:31:46'),
(55, 1, NULL, 'Gallipots', NULL, NULL, NULL, 0.000, 0.000, 300.00, 0.00, 'active', '2026-11-03 10:32:40', '2026-11-03 10:32:40'),
(56, 1, NULL, 'Surgical Sutures (Absorbable- vicyryl 2-0)', NULL, NULL, NULL, 0.000, 0.000, 1400.00, 0.00, 'active', '2026-11-03 10:34:28', '2026-11-03 10:34:28'),
(57, 1, NULL, 'Surgical sutures (Non-absorbable nylon 3-0)', NULL, NULL, NULL, 0.000, 0.000, 1.00, 0.00, 'active', '2026-11-03 10:38:02', '2026-11-03 10:38:02'),
(58, 1, NULL, 'Surgical sutures (Non-absorbable nylon 2-0)', NULL, NULL, NULL, 0.000, 0.000, 1.00, 0.00, 'active', '2026-11-03 10:38:45', '2026-11-03 10:38:45'),
(59, 1, NULL, 'Storage drum', NULL, NULL, NULL, 0.000, 0.000, 1.00, 0.00, 'active', '2026-11-03 10:39:40', '2026-11-03 10:39:40'),
(60, 1, NULL, 'Storage drum 23', NULL, NULL, NULL, 0.000, 0.000, 2500.00, 0.00, 'active', '2026-11-03 13:52:15', '2026-11-03 13:52:15'),
(61, 1, NULL, 'Sorage drum 30', NULL, NULL, NULL, 0.000, 0.000, 3000.00, 0.00, 'active', '2026-11-03 13:52:44', '2026-11-03 13:52:44'),
(62, 1, NULL, 'Tray receiver with cover', NULL, NULL, NULL, 0.000, 0.000, 1800.00, 0.00, 'active', '2026-11-03 17:10:57', '2026-11-03 17:10:57'),
(63, 1, NULL, 'Storage drum 23', NULL, NULL, NULL, 0.000, 0.000, 3000.00, 0.00, 'active', '2026-11-03 17:13:31', '2026-11-03 17:13:31'),
(64, 1, NULL, 'Storage drum 30', NULL, NULL, NULL, 0.000, 0.000, 3500.00, 0.00, 'active', '2026-11-03 17:14:14', '2026-11-03 17:14:14'),
(65, 1, NULL, 'Surgical Sutures (Absorbable- vicyryl 2-0)', NULL, NULL, NULL, 0.000, 0.000, 1500.00, 0.00, 'active', '2026-11-04 08:18:13', '2026-11-04 08:18:13'),
(66, 1, NULL, 'Surgical Sutures (Absorbable- vicyryl 3-0)', NULL, NULL, NULL, 0.000, 0.000, 1500.00, 0.00, 'active', '2026-11-04 08:18:54', '2026-11-04 08:18:54'),
(67, 1, NULL, 'Surgical sutures (Non-absorbable nylon 2-0)', NULL, NULL, NULL, 0.000, 0.000, 550.00, 0.00, 'active', '2026-11-04 08:19:35', '2026-11-04 08:19:35'),
(68, 1, NULL, 'Surgical sutures (Non-absorbable nylon 3-0)', NULL, NULL, NULL, 0.000, 0.000, 550.00, 0.00, 'active', '2026-11-04 08:20:57', '2026-11-04 08:20:57'),
(69, 1, NULL, 'Patient Monitor (5 Parameters)', NULL, NULL, NULL, 0.000, 0.000, 60000.00, 0.00, 'active', '2026-11-04 15:50:10', '2026-11-04 15:50:10'),
(70, 1, NULL, 'Patient Monitor (5 Parameters)', NULL, NULL, NULL, 0.000, 0.000, 60000.00, 0.00, 'active', '2026-11-06 09:55:49', '2026-11-06 09:55:49'),
(71, 1, NULL, 'Needle holder', NULL, NULL, NULL, 0.000, 0.000, 500.00, 0.00, 'active', '2026-11-06 16:44:51', '2026-11-06 16:44:51'),
(72, 1, NULL, 'Vulsellum Forceps', NULL, NULL, NULL, 0.000, 0.000, 1500.00, 0.00, 'active', '2026-11-06 16:48:17', '2026-11-06 16:48:17'),
(73, 1, NULL, 'Forceps jar', NULL, NULL, NULL, 0.000, 0.000, 1.00, 0.00, 'active', '2026-11-06 16:50:39', '2026-11-06 16:50:39'),
(74, 1, NULL, 'Diagnostic set', NULL, NULL, NULL, 0.000, 0.000, 10000.00, 0.00, 'active', '2026-11-06 16:51:17', '2026-11-06 16:51:17'),
(75, 1, NULL, 'Non toothed tissue forceps', NULL, NULL, NULL, 0.000, 0.000, 350.00, 0.00, 'active', '2026-11-06 16:52:20', '2026-11-06 16:52:20'),
(76, 1, NULL, 'Non disposable speculum', NULL, NULL, NULL, 0.000, 0.000, 1.00, 0.00, 'active', '2026-11-06 16:53:51', '2026-11-06 16:53:51'),
(77, 1, NULL, 'ESR Fast Detector', NULL, NULL, NULL, 0.000, 0.000, 5000.00, 0.00, 'active', '2026-11-17 13:27:24', '2026-11-17 13:27:24'),
(78, 1, NULL, 'ESR Fast Detector Tubes (100pcs)', NULL, NULL, NULL, 0.000, 0.000, 2500.00, 0.00, 'active', '2026-11-17 13:29:04', '2026-11-17 13:29:04'),
(79, 1, NULL, 'ESR Fast Detector Tubes (100pcs)', NULL, NULL, NULL, 0.000, 0.000, 2500.00, 0.00, 'active', '2026-11-17 13:29:14', '2026-11-17 13:29:14'),
(80, 1, NULL, 'Hemocue 301 strips', NULL, NULL, NULL, 0.000, 0.000, 3500.00, 0.00, 'active', '2026-11-17 13:30:23', '2026-11-17 13:30:23'),
(81, 1, NULL, 'Stepping stool', NULL, NULL, NULL, 0.000, 0.000, 3500.00, 0.00, 'active', '2026-11-17 13:30:42', '2026-11-17 13:30:42'),
(82, 1, NULL, 'Patella hammer', NULL, NULL, NULL, 0.000, 0.000, 500.00, 0.00, 'active', '2026-11-17 13:31:13', '2026-11-17 13:31:13'),
(83, 1, NULL, 'Pen touch', NULL, NULL, NULL, 0.000, 0.000, 300.00, 0.00, 'active', '2026-11-17 13:31:32', '2026-11-17 13:31:32'),
(84, 1, NULL, 'Muac tape', NULL, NULL, NULL, 0.000, 0.000, 150.00, 0.00, 'active', '2026-11-17 13:31:55', '2026-11-17 13:31:55'),
(85, 1, NULL, 'Medical Pen Torch', NULL, NULL, NULL, 0.000, 0.000, 300.00, 0.00, 'active', '2026-11-17 13:35:51', '2026-11-17 13:35:51'),
(86, 1, NULL, 'Muac tape', NULL, NULL, NULL, 0.000, 0.000, 150.00, 0.00, 'active', '2026-11-17 13:36:54', '2026-11-17 13:36:54');

-- --------------------------------------------------------

--
-- Table structure for table `product_categories`
--

CREATE TABLE `product_categories` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `product_code` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `profiles`
--

CREATE TABLE `profiles` (
  `id` int NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `department` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invited_by` int DEFAULT NULL,
  `invited_at` timestamp NULL DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `profiles`
--

INSERT INTO `profiles` (`id`, `email`, `full_name`, `avatar_url`, `role`, `status`, `phone`, `company_id`, `department`, `position`, `invited_by`, `invited_at`, `last_login`, `created_at`, `updated_at`) VALUES
(1, 'info@diagsolutionsltd.com', 'Admin User', NULL, 'admin', 'active', '', 1, '', '', NULL, NULL, '2026-11-19 12:26:31', '2026-01-17 14:26:22', '2026-11-19 15:26:32'),
(2, 'user@example.com', 'Regular User', NULL, 'accountant', 'active', '', 1, '', '', NULL, NULL, '2026-02-03 11:59:36', '2026-01-17 14:26:22', '2026-02-04 16:00:13');

-- --------------------------------------------------------

--
-- Table structure for table `proforma_invoices`
--

CREATE TABLE `proforma_invoices` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `proforma_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `proforma_date` date DEFAULT (curdate()),
  `subtotal` decimal(15,2) DEFAULT '0.00',
  `tax_percentage` decimal(5,2) DEFAULT '0.00',
  `tax_amount` decimal(15,2) DEFAULT '0.00',
  `total_amount` decimal(15,2) DEFAULT '0.00',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `valid_until` date DEFAULT NULL,
  `terms_and_conditions` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `proforma_items`
--

CREATE TABLE `proforma_items` (
  `id` int NOT NULL,
  `proforma_id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(10,3) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `line_total` decimal(15,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quotations`
--

CREATE TABLE `quotations` (
  `id` int NOT NULL,
  `company_id` int NOT NULL DEFAULT '0',
  `customer_id` int DEFAULT NULL,
  `portfolio_id` int DEFAULT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `customer_email` varchar(255) DEFAULT NULL,
  `customer_phone` varchar(20) DEFAULT NULL,
  `quotation_number` varchar(255) DEFAULT NULL,
  `quotation_date` date DEFAULT NULL,
  `valid_until` date DEFAULT NULL,
  `project_description` text,
  `budget_range` varchar(100) DEFAULT NULL,
  `timeline` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'draft',
  `subtotal` decimal(12,2) DEFAULT '0.00',
  `tax_amount` decimal(12,2) DEFAULT '0.00',
  `total_amount` decimal(12,2) DEFAULT '0.00',
  `notes` text,
  `terms_and_conditions` text,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `quotations`
--

INSERT INTO `quotations` (`id`, `company_id`, `customer_id`, `portfolio_id`, `customer_name`, `customer_email`, `customer_phone`, `quotation_number`, `quotation_date`, `valid_until`, `project_description`, `budget_range`, `timeline`, `status`, `subtotal`, `tax_amount`, `total_amount`, `notes`, `terms_and_conditions`, `created_by`, `created_at`, `updated_at`) VALUES
(3, 1, 2, NULL, NULL, NULL, NULL, 'QT-05092026-12', '2026-09-05', '2026-10-05', NULL, NULL, NULL, 'draft', 2011500.00, 0.00, 2011500.00, '', '', 1, '2026-09-05 10:21:06', '2026-09-08 06:59:30'),
(5, 1, 3, NULL, NULL, NULL, NULL, 'QT-09102026-14', '2026-10-09', '2026-11-08', NULL, NULL, NULL, 'draft', 100000.00, 0.00, 100000.00, '', 'Quotation valid for 30 days.All deliveries to incur freight charges', 1, '2026-10-09 16:55:00', '2026-10-09 16:55:00'),
(8, 1, 4, NULL, NULL, NULL, NULL, 'QT-13102026-17', '2026-10-13', '2026-11-12', NULL, NULL, NULL, 'converted', 3800.00, 0.00, 3800.00, '', 'Quotation valid for 30 days.\nAll deliveries to incur freight charges.', 1, '2026-10-13 10:11:48', '2026-10-13 20:53:46'),
(9, 1, 5, NULL, NULL, NULL, NULL, 'QT-16102026-18', '2026-10-16', '2026-11-15', NULL, NULL, NULL, 'converted', 4800.00, 0.00, 4800.00, '', 'Quotation valid for 30days. All deliveries to incur shipping charges', 1, '2026-10-16 12:01:25', '2026-10-20 16:39:53'),
(12, 1, 7, NULL, NULL, NULL, NULL, 'QT-03112026-21', '2026-11-02', '2026-12-02', NULL, NULL, NULL, 'converted', 107450.00, 0.00, 107450.00, '', 'Quotation valid for 30 days. All deliveries to incur freight charges.', 1, '2026-11-03 10:42:24', '2026-11-06 08:46:04'),
(13, 1, 7, NULL, NULL, NULL, NULL, 'QT-06112026-22', '2026-11-06', '2026-12-06', NULL, NULL, NULL, 'draft', 15752.00, 0.00, 15752.00, '', '', 1, '2026-11-06 16:54:44', '2026-11-06 16:54:44'),
(14, 1, 8, NULL, NULL, NULL, NULL, 'QT-17112026-23', '2026-11-17', '2026-12-17', NULL, NULL, NULL, 'converted', 15450.00, 0.00, 15450.00, '', 'Quotation Valid for 30 days. All deliveries to incur freight charges', 1, '2026-11-17 13:37:06', '2026-11-17 19:30:57');

-- --------------------------------------------------------

--
-- Table structure for table `quotation_items`
--

CREATE TABLE `quotation_items` (
  `id` int NOT NULL,
  `quotation_id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(10,3) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `tax_percentage` decimal(5,2) DEFAULT '0.00',
  `tax_amount` decimal(15,2) DEFAULT '0.00',
  `tax_inclusive` tinyint(1) DEFAULT '0',
  `tax_setting_id` int DEFAULT NULL,
  `line_total` decimal(15,2) NOT NULL,
  `sort_order` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quotation_items`
--

INSERT INTO `quotation_items` (`id`, `quotation_id`, `product_id`, `description`, `quantity`, `unit_price`, `tax_percentage`, `tax_amount`, `tax_inclusive`, `tax_setting_id`, `line_total`, `sort_order`) VALUES
(273, 3, 3, 'Hydralic Operating Table', 1.000, 250000.00, 0.00, 0.00, 0, NULL, 250000.00, 1),
(274, 3, 4, 'Patient Monitor (5 Parameters)', 1.000, 60000.00, 0.00, 0.00, 0, NULL, 60000.00, 2),
(275, 3, 6, 'Patient Stretcher', 1.000, 35000.00, 0.00, 0.00, 0, NULL, 35000.00, 3),
(276, 3, 8, 'Single Arm Operating Theatre Light', 1.000, 210000.00, 0.00, 0.00, 0, NULL, 210000.00, 4),
(277, 3, 9, 'Mayo Trolley', 2.000, 9000.00, 0.00, 0.00, 0, NULL, 18000.00, 5),
(278, 3, 10, 'Suction machine (Two bottle)', 2.000, 20000.00, 0.00, 0.00, 0, NULL, 40000.00, 6),
(279, 3, 11, 'Standard Wheelchair', 1.000, 11000.00, 0.00, 0.00, 0, NULL, 11000.00, 7),
(280, 3, 13, 'Ambubag', 1.000, 3000.00, 0.00, 0.00, 0, NULL, 3000.00, 8),
(281, 3, 14, 'Fetal Doppler', 1.000, 8000.00, 0.00, 0.00, 0, NULL, 8000.00, 9),
(282, 3, 15, 'Digital Scale Baby', 1.000, 6500.00, 0.00, 0.00, 0, NULL, 6500.00, 10),
(283, 3, 17, 'Complete Dental Unit', 1.000, 350000.00, 0.00, 0.00, 0, NULL, 350000.00, 11),
(284, 3, 18, 'Radiant Baby Warmer', 1.000, 210000.00, 0.00, 0.00, 0, NULL, 210000.00, 12),
(285, 3, 19, 'Laryngoscope', 1.000, 190000.00, 0.00, 0.00, 0, NULL, 190000.00, 13),
(286, 3, 22, 'Oxygen Concentrator (10L)', 2.000, 110000.00, 0.00, 0.00, 0, NULL, 220000.00, 14),
(287, 3, 23, 'Drip Stand', 2.000, 3500.00, 0.00, 0.00, 0, NULL, 7000.00, 15),
(288, 3, 24, 'Diathermy Machine (400W)', 1.000, 200000.00, 0.00, 0.00, 0, NULL, 200000.00, 16),
(289, 3, 25, 'Autoclave (50Litres)', 1.000, 185000.00, 0.00, 0.00, 0, NULL, 185000.00, 17),
(290, 3, 26, 'Laryngoscope Blades (4 Blades)', 1.000, 8000.00, 0.00, 0.00, 0, NULL, 8000.00, 18),
(294, 5, 30, 'Anbio Immunoassay analyzer (AIA)', 1.000, 100000.00, 0.00, 0.00, 0, NULL, 100000.00, 1),
(295, 5, 31, 'HbA1c test kit', 1.000, 0.00, 0.00, 0.00, 0, NULL, 0.00, 2),
(298, 8, 34, 'Magnesium', 1.000, 3800.00, 0.00, 0.00, 0, NULL, 3800.00, 1),
(299, 9, 35, 'Brucella reagent', 1.000, 1500.00, 0.00, 0.00, 0, NULL, 1500.00, 1),
(300, 9, 36, 'Antisera (Anti A,B & D)', 1.000, 1600.00, 0.00, 0.00, 0, NULL, 1600.00, 2),
(301, 9, 37, 'Microtainers EDTA tubes', 1.000, 1500.00, 0.00, 0.00, 0, NULL, 1500.00, 3),
(302, 9, 38, 'Shipping charges', 1.000, 200.00, 0.00, 0.00, 0, NULL, 200.00, 4),
(473, 12, 45, 'Scissors (curved)', 5.000, 500.00, 0.00, 0.00, 0, NULL, 2500.00, 1),
(474, 12, 46, 'Scissors (straight)', 5.000, 500.00, 0.00, 0.00, 0, NULL, 2500.00, 2),
(475, 12, 47, 'Scalpel holder (No.4)', 5.000, 300.00, 0.00, 0.00, 0, NULL, 1500.00, 3),
(476, 12, 48, 'Adson Forceps (Toothed)', 5.000, 450.00, 0.00, 0.00, 0, NULL, 2250.00, 4),
(477, 12, 49, 'Adson Forceps (non-toothed)', 5.000, 450.00, 0.00, 0.00, 0, NULL, 2250.00, 5),
(478, 12, 50, 'Artery Forceps (curved)', 5.000, 600.00, 0.00, 0.00, 0, NULL, 3000.00, 6),
(479, 12, 51, 'Artery forceps (straight)', 5.000, 600.00, 0.00, 0.00, 0, NULL, 3000.00, 7),
(480, 12, 52, 'Mosquito forceps', 5.000, 450.00, 0.00, 0.00, 0, NULL, 2250.00, 8),
(481, 12, 53, 'Kidney dish', 5.000, 500.00, 0.00, 0.00, 0, NULL, 2500.00, 9),
(482, 12, 54, 'Sponge Holding Forceps', 5.000, 1000.00, 0.00, 0.00, 0, NULL, 5000.00, 10),
(483, 12, 55, 'Gallipots', 5.000, 300.00, 0.00, 0.00, 0, NULL, 1500.00, 11),
(484, 12, 62, 'Tray receiver with cover', 5.000, 1800.00, 0.00, 0.00, 0, NULL, 9000.00, 12),
(485, 12, 63, 'Storage drum 23', 1.000, 3000.00, 0.00, 0.00, 0, NULL, 3000.00, 13),
(486, 12, 64, 'Storage drum 30', 1.000, 3500.00, 0.00, 0.00, 0, NULL, 3500.00, 14),
(487, 12, 65, 'Surgical Sutures (Absorbable- vicyryl 2-0)', 1.000, 1300.00, 0.00, 0.00, 0, NULL, 1300.00, 15),
(488, 12, 66, 'Surgical Sutures (Absorbable- vicyryl 3-0)', 1.000, 1300.00, 0.00, 0.00, 0, NULL, 1300.00, 16),
(489, 12, 67, 'Surgical sutures (Non-absorbable nylon 2-0)', 1.000, 550.00, 0.00, 0.00, 0, NULL, 550.00, 17),
(490, 12, 68, 'Surgical sutures (Non-absorbable nylon 3-0)', 1.000, 550.00, 0.00, 0.00, 0, NULL, 550.00, 18),
(491, 12, 69, 'Patient Monitor (5 Parameters)', 1.000, 60000.00, 0.00, 0.00, 0, NULL, 60000.00, 19),
(492, 13, 71, 'Needle holder', 5.000, 500.00, 0.00, 0.00, 0, NULL, 2500.00, 1),
(493, 13, 72, 'Vulsellum Forceps', 1.000, 1500.00, 0.00, 0.00, 0, NULL, 1500.00, 2),
(494, 13, 73, 'Forceps jar', 1.000, 1.00, 0.00, 0.00, 0, NULL, 1.00, 3),
(495, 13, 74, 'Diagnostic set', 1.000, 10000.00, 0.00, 0.00, 0, NULL, 10000.00, 4),
(496, 13, 75, 'Non toothed tissue forceps', 5.000, 350.00, 0.00, 0.00, 0, NULL, 1750.00, 5),
(497, 13, 76, 'Non disposable speculum', 1.000, 1.00, 0.00, 0.00, 0, NULL, 1.00, 6),
(498, 14, 77, 'ESR Fast Detector', 1.000, 5000.00, 0.00, 0.00, 0, NULL, 5000.00, 1),
(499, 14, 79, 'ESR Fast Detector Tubes (100pcs)', 1.000, 2500.00, 0.00, 0.00, 0, NULL, 2500.00, 2),
(500, 14, 80, 'Hemocue 301 strips', 1.000, 3500.00, 0.00, 0.00, 0, NULL, 3500.00, 3),
(501, 14, 81, 'Stepping stool', 1.000, 3500.00, 0.00, 0.00, 0, NULL, 3500.00, 4),
(502, 14, 82, 'Patella hammer', 1.000, 500.00, 0.00, 0.00, 0, NULL, 500.00, 5),
(503, 14, 85, 'Medical Pen Torch', 1.000, 300.00, 0.00, 0.00, 0, NULL, 300.00, 6),
(504, 14, 86, 'Muac tape', 1.000, 150.00, 0.00, 0.00, 0, NULL, 150.00, 7);

-- --------------------------------------------------------

--
-- Table structure for table `receipts`
--

CREATE TABLE `receipts` (
  `id` int NOT NULL COMMENT 'Primary key',
  `company_id` int NOT NULL COMMENT 'Foreign key to companies',
  `payment_id` int NOT NULL COMMENT 'Foreign key to payments',
  `invoice_id` int NOT NULL COMMENT 'Foreign key to invoices',
  `receipt_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Independent receipt numbering (REC-XXXX format)',
  `receipt_date` date NOT NULL COMMENT 'When receipt was issued',
  `receipt_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'payment_against_invoice' COMMENT 'direct_receipt, payment_against_invoice',
  `total_amount` decimal(15,2) NOT NULL COMMENT 'Total received',
  `excess_amount` decimal(15,2) DEFAULT '0.00' COMMENT 'Amount over invoice total (if any)',
  `excess_handling` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending' COMMENT 'credit_balance, change_note, pending',
  `change_note_id` int DEFAULT NULL COMMENT 'If excess_handling = change_note',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Additional notes',
  `created_by` int DEFAULT NULL COMMENT 'User who created the receipt',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `receipt_items`
--

CREATE TABLE `receipt_items` (
  `id` int NOT NULL,
  `receipt_id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `quantity` decimal(10,3) DEFAULT '1.000',
  `unit_price` decimal(15,2) DEFAULT '0.00',
  `tax_percentage` decimal(5,2) DEFAULT '0.00',
  `tax_amount` decimal(15,2) DEFAULT '0.00',
  `tax_inclusive` tinyint(1) DEFAULT '0',
  `tax_setting_id` int DEFAULT NULL,
  `discount_before_vat` decimal(15,2) DEFAULT '0.00',
  `line_total` decimal(15,2) DEFAULT '0.00',
  `sort_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `remittance_advice`
--

CREATE TABLE `remittance_advice` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `supplier_id` int NOT NULL,
  `remittance_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_amount` decimal(15,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `remittance_advice_items`
--

CREATE TABLE `remittance_advice_items` (
  `id` int NOT NULL,
  `remittance_id` int NOT NULL,
  `invoice_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'custom',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `permissions` json DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `company_id`, `name`, `role_type`, `description`, `permissions`, `is_default`, `is_active`, `created_at`, `updated_at`) VALUES
(8, 1, 'admin', 'admin', 'Full system access', '[\"create_quotation\", \"view_quotation\", \"edit_quotation\", \"delete_quotation\", \"export_quotation\", \"create_invoice\", \"view_invoice\", \"edit_invoice\", \"delete_invoice\", \"export_invoice\", \"create_credit_note\", \"view_credit_note\", \"edit_credit_note\", \"delete_credit_note\", \"export_credit_note\", \"create_proforma\", \"view_proforma\", \"edit_proforma\", \"delete_proforma\", \"export_proforma\", \"create_payment\", \"view_payment\", \"edit_payment\", \"delete_payment\", \"create_inventory\", \"view_inventory\", \"edit_inventory\", \"delete_inventory\", \"manage_inventory\", \"view_reports\", \"export_reports\", \"view_customer_reports\", \"view_inventory_reports\", \"view_sales_reports\", \"create_customer\", \"view_customer\", \"edit_customer\", \"delete_customer\", \"create_delivery_note\", \"view_delivery_note\", \"edit_delivery_note\", \"delete_delivery_note\", \"create_lpo\", \"view_lpo\", \"edit_lpo\", \"delete_lpo\", \"create_remittance\", \"view_remittance\", \"edit_remittance\", \"delete_remittance\", \"create_user\", \"edit_user\", \"delete_user\", \"manage_users\", \"approve_users\", \"invite_users\", \"view_audit_logs\", \"manage_roles\", \"manage_permissions\", \"access_settings\"]', 1, 1, '2026-01-17 15:31:15', '2026-02-04 17:18:31'),
(900493, 1, 'stock_manager', 'stock_manager', 'Inventory access', '[\"view_inventory\", \"manage_inventory\"]', 1, 1, '2026-01-17 15:31:15', '2026-02-04 17:18:55'),
(900494, 1, 'sales', 'sales', 'Sales team member with limited access - can create and view quotations, invoices, and proforma without delete permissions', '[\"create_quotation\", \"view_quotation\", \"edit_quotation\", \"export_quotation\", \"create_invoice\", \"view_invoice\", \"edit_invoice\", \"export_invoice\", \"create_proforma\", \"view_proforma\", \"edit_proforma\", \"export_proforma\", \"create_customer\", \"view_customer\", \"edit_customer\", \"view_reports\", \"export_reports\", \"view_customer_reports\", \"view_sales_reports\", \"view_lpo\", \"view_payment\", \"view_delivery_note\", \"view_remittance\"]', 0, 1, '2026-01-26 05:58:10', '2026-10-07 11:46:02'),
(900495, 1, 'accountant', 'accountant', 'Accounts team member with limited access - can manage payments, invoices, and credit notes without delete permissions', '[\"create_invoice\", \"view_invoice\", \"edit_invoice\", \"export_invoice\", \"create_payment\", \"view_payment\", \"edit_payment\", \"create_credit_note\", \"view_credit_note\", \"edit_credit_note\", \"export_credit_note\", \"view_proforma\", \"export_proforma\", \"view_quotation\", \"export_quotation\", \"view_customer\", \"create_remittance\", \"view_remittance\", \"edit_remittance\", \"view_lpo\", \"view_reports\", \"export_reports\", \"view_customer_reports\", \"view_sales_reports\", \"view_delivery_note\", \"view_audit_logs\"]', 0, 1, '2026-01-26 05:58:11', '2026-02-04 17:19:12');

-- --------------------------------------------------------

--
-- Table structure for table `stock_movements`
--

CREATE TABLE `stock_movements` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `product_id` int NOT NULL,
  `movement_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `quantity` decimal(10,3) NOT NULL,
  `cost_per_unit` decimal(15,2) DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `movement_date` date DEFAULT (curdate()),
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stock_movements`
--

INSERT INTO `stock_movements` (`id`, `company_id`, `product_id`, `movement_type`, `reference_type`, `reference_id`, `quantity`, `cost_per_unit`, `notes`, `movement_date`, `created_by`, `created_at`, `updated_at`) VALUES
(2, 1, 1, 'IN', 'ADJUSTMENT', 1, -1.000, NULL, 'Reversal for updated invoice undefined', '2026-10-07', NULL, '2026-10-06 22:44:50', '2026-10-06 22:44:50'),
(7, 1, 1, 'OUT', 'INVOICE', 5, 1.000, 6500.00, 'Stock reduction for invoice INV-12102026-19', '2026-10-12', NULL, '2026-10-12 10:13:04', '2026-10-12 10:13:04'),
(8, 1, 6, 'OUT', 'INVOICE', 6, 1.000, 35000.00, 'Stock reduction for invoice INV-12102026-20', '2026-10-12', NULL, '2026-10-12 17:16:35', '2026-10-12 17:16:35'),
(9, 1, 5, 'OUT', 'INVOICE', 6, 1.000, 100000.00, 'Stock reduction for invoice INV-12102026-20', '2026-10-12', NULL, '2026-10-12 17:16:35', '2026-10-12 17:16:35'),
(10, 1, 7, 'OUT', 'INVOICE', 6, 1.000, 180000.00, 'Stock reduction for invoice INV-12102026-20', '2026-10-12', NULL, '2026-10-12 17:16:35', '2026-10-12 17:16:35'),
(11, 1, 8, 'OUT', 'INVOICE', 6, 1.000, 210000.00, 'Stock reduction for invoice INV-12102026-20', '2026-10-12', NULL, '2026-10-12 17:16:35', '2026-10-12 17:16:35'),
(12, 1, 9, 'OUT', 'INVOICE', 6, 1.000, 9000.00, 'Stock reduction for invoice INV-12102026-20', '2026-10-12', NULL, '2026-10-12 17:16:36', '2026-10-12 17:16:36'),
(13, 1, 10, 'OUT', 'INVOICE', 6, 1.000, 20500.00, 'Stock reduction for invoice INV-12102026-20', '2026-10-12', NULL, '2026-10-12 17:16:36', '2026-10-12 17:16:36'),
(14, 1, 34, 'OUT', 'INVOICE', 7, 1.000, 3800.00, 'Stock reduction for invoice INV-13102026-21 (converted from quotation QT-13102026-17)', '2026-10-13', NULL, '2026-10-13 20:53:46', '2026-10-13 20:53:46'),
(15, 1, 35, 'OUT', 'INVOICE', 8, 1.000, 1500.00, 'Stock reduction for invoice INV-20102026-22 (converted from quotation QT-16102026-18)', '2026-10-20', NULL, '2026-10-20 16:39:52', '2026-10-20 16:39:52'),
(16, 1, 36, 'OUT', 'INVOICE', 8, 1.000, 1600.00, 'Stock reduction for invoice INV-20102026-22 (converted from quotation QT-16102026-18)', '2026-10-20', NULL, '2026-10-20 16:39:53', '2026-10-20 16:39:53'),
(17, 1, 37, 'OUT', 'INVOICE', 8, 1.000, 1500.00, 'Stock reduction for invoice INV-20102026-22 (converted from quotation QT-16102026-18)', '2026-10-20', NULL, '2026-10-20 16:39:53', '2026-10-20 16:39:53'),
(18, 1, 38, 'OUT', 'INVOICE', 8, 1.000, 200.00, 'Stock reduction for invoice INV-20102026-22 (converted from quotation QT-16102026-18)', '2026-10-20', NULL, '2026-10-20 16:39:53', '2026-10-20 16:39:53'),
(19, 1, 45, 'OUT', 'INVOICE', 9, 5.000, 500.00, 'Stock reduction for invoice INV-06112026-23 (converted from quotation QT-03112026-21)', '2026-11-06', NULL, '2026-11-06 08:45:58', '2026-11-06 08:45:58'),
(20, 1, 46, 'OUT', 'INVOICE', 9, 5.000, 500.00, 'Stock reduction for invoice INV-06112026-23 (converted from quotation QT-03112026-21)', '2026-11-06', NULL, '2026-11-06 08:45:59', '2026-11-06 08:45:59'),
(21, 1, 47, 'OUT', 'INVOICE', 9, 5.000, 300.00, 'Stock reduction for invoice INV-06112026-23 (converted from quotation QT-03112026-21)', '2026-11-06', NULL, '2026-11-06 08:45:59', '2026-11-06 08:45:59'),
(22, 1, 48, 'OUT', 'INVOICE', 9, 5.000, 450.00, 'Stock reduction for invoice INV-06112026-23 (converted from quotation QT-03112026-21)', '2026-11-06', NULL, '2026-11-06 08:45:59', '2026-11-06 08:45:59'),
(23, 1, 49, 'OUT', 'INVOICE', 9, 5.000, 450.00, 'Stock reduction for invoice INV-06112026-23 (converted from quotation QT-03112026-21)', '2026-11-06', NULL, '2026-11-06 08:46:00', '2026-11-06 08:46:00'),
(24, 1, 50, 'OUT', 'INVOICE', 9, 5.000, 600.00, 'Stock reduction for invoice INV-06112026-23 (converted from quotation QT-03112026-21)', '2026-11-06', NULL, '2026-11-06 08:46:00', '2026-11-06 08:46:00'),
(25, 1, 51, 'OUT', 'INVOICE', 9, 5.000, 600.00, 'Stock reduction for invoice INV-06112026-23 (converted from quotation QT-03112026-21)', '2026-11-06', NULL, '2026-11-06 08:46:00', '2026-11-06 08:46:00'),
(26, 1, 52, 'OUT', 'INVOICE', 9, 5.000, 450.00, 'Stock reduction for invoice INV-06112026-23 (converted from quotation QT-03112026-21)', '2026-11-06', NULL, '2026-11-06 08:46:01', '2026-11-06 08:46:01'),
(27, 1, 53, 'OUT', 'INVOICE', 9, 5.000, 500.00, 'Stock reduction for invoice INV-06112026-23 (converted from quotation QT-03112026-21)', '2026-11-06', NULL, '2026-11-06 08:46:01', '2026-11-06 08:46:01'),
(28, 1, 54, 'OUT', 'INVOICE', 9, 5.000, 1000.00, 'Stock reduction for invoice INV-06112026-23 (converted from quotation QT-03112026-21)', '2026-11-06', NULL, '2026-11-06 08:46:01', '2026-11-06 08:46:01'),
(29, 1, 55, 'OUT', 'INVOICE', 9, 5.000, 300.00, 'Stock reduction for invoice INV-06112026-23 (converted from quotation QT-03112026-21)', '2026-11-06', NULL, '2026-11-06 08:46:02', '2026-11-06 08:46:02'),
(30, 1, 62, 'OUT', 'INVOICE', 9, 5.000, 1800.00, 'Stock reduction for invoice INV-06112026-23 (converted from quotation QT-03112026-21)', '2026-11-06', NULL, '2026-11-06 08:46:02', '2026-11-06 08:46:02'),
(31, 1, 63, 'OUT', 'INVOICE', 9, 1.000, 3000.00, 'Stock reduction for invoice INV-06112026-23 (converted from quotation QT-03112026-21)', '2026-11-06', NULL, '2026-11-06 08:46:02', '2026-11-06 08:46:02'),
(32, 1, 64, 'OUT', 'INVOICE', 9, 1.000, 3500.00, 'Stock reduction for invoice INV-06112026-23 (converted from quotation QT-03112026-21)', '2026-11-06', NULL, '2026-11-06 08:46:02', '2026-11-06 08:46:02'),
(33, 1, 65, 'OUT', 'INVOICE', 9, 1.000, 1300.00, 'Stock reduction for invoice INV-06112026-23 (converted from quotation QT-03112026-21)', '2026-11-06', NULL, '2026-11-06 08:46:03', '2026-11-06 08:46:03'),
(34, 1, 66, 'OUT', 'INVOICE', 9, 1.000, 1300.00, 'Stock reduction for invoice INV-06112026-23 (converted from quotation QT-03112026-21)', '2026-11-06', NULL, '2026-11-06 08:46:03', '2026-11-06 08:46:03'),
(35, 1, 67, 'OUT', 'INVOICE', 9, 1.000, 550.00, 'Stock reduction for invoice INV-06112026-23 (converted from quotation QT-03112026-21)', '2026-11-06', NULL, '2026-11-06 08:46:03', '2026-11-06 08:46:03'),
(36, 1, 68, 'OUT', 'INVOICE', 9, 1.000, 550.00, 'Stock reduction for invoice INV-06112026-23 (converted from quotation QT-03112026-21)', '2026-11-06', NULL, '2026-11-06 08:46:04', '2026-11-06 08:46:04'),
(37, 1, 69, 'OUT', 'INVOICE', 9, 1.000, 60000.00, 'Stock reduction for invoice INV-06112026-23 (converted from quotation QT-03112026-21)', '2026-11-06', NULL, '2026-11-06 08:46:04', '2026-11-06 08:46:04'),
(38, 1, 45, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:39', '2026-11-06 09:40:39'),
(39, 1, 46, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:40', '2026-11-06 09:40:40'),
(40, 1, 47, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:40', '2026-11-06 09:40:40'),
(41, 1, 48, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:40', '2026-11-06 09:40:40'),
(42, 1, 49, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:41', '2026-11-06 09:40:41'),
(43, 1, 50, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:41', '2026-11-06 09:40:41'),
(44, 1, 51, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:41', '2026-11-06 09:40:41'),
(45, 1, 52, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:41', '2026-11-06 09:40:41'),
(46, 1, 53, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:42', '2026-11-06 09:40:42'),
(47, 1, 54, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:42', '2026-11-06 09:40:42'),
(48, 1, 55, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:42', '2026-11-06 09:40:42'),
(49, 1, 62, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:43', '2026-11-06 09:40:43'),
(50, 1, 63, 'IN', 'ADJUSTMENT', 9, -1.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:43', '2026-11-06 09:40:43'),
(51, 1, 64, 'IN', 'ADJUSTMENT', 9, -1.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:43', '2026-11-06 09:40:43'),
(52, 1, 65, 'IN', 'ADJUSTMENT', 9, -1.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:44', '2026-11-06 09:40:44'),
(53, 1, 66, 'IN', 'ADJUSTMENT', 9, -1.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:44', '2026-11-06 09:40:44'),
(54, 1, 67, 'IN', 'ADJUSTMENT', 9, -1.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:44', '2026-11-06 09:40:44'),
(55, 1, 68, 'IN', 'ADJUSTMENT', 9, -1.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:45', '2026-11-06 09:40:45'),
(56, 1, 69, 'IN', 'ADJUSTMENT', 9, -1.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:45', '2026-11-06 09:40:45'),
(57, 0, 45, 'OUT', 'INVOICE', 9, 5.000, 500.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:58', '2026-11-06 09:40:58'),
(58, 0, 46, 'OUT', 'INVOICE', 9, 5.000, 500.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:58', '2026-11-06 09:40:58'),
(59, 0, 47, 'OUT', 'INVOICE', 9, 5.000, 300.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:58', '2026-11-06 09:40:58'),
(60, 0, 48, 'OUT', 'INVOICE', 9, 5.000, 450.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:59', '2026-11-06 09:40:59'),
(61, 0, 49, 'OUT', 'INVOICE', 9, 5.000, 450.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:59', '2026-11-06 09:40:59'),
(62, 0, 50, 'OUT', 'INVOICE', 9, 5.000, 600.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:40:59', '2026-11-06 09:40:59'),
(63, 0, 51, 'OUT', 'INVOICE', 9, 5.000, 600.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:41:00', '2026-11-06 09:41:00'),
(64, 0, 52, 'OUT', 'INVOICE', 9, 5.000, 450.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:41:00', '2026-11-06 09:41:00'),
(65, 0, 53, 'OUT', 'INVOICE', 9, 5.000, 500.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:41:00', '2026-11-06 09:41:00'),
(66, 0, 54, 'OUT', 'INVOICE', 9, 5.000, 1000.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:41:01', '2026-11-06 09:41:01'),
(67, 0, 55, 'OUT', 'INVOICE', 9, 5.000, 300.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:41:01', '2026-11-06 09:41:01'),
(68, 0, 62, 'OUT', 'INVOICE', 9, 5.000, 1800.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:41:01', '2026-11-06 09:41:01'),
(69, 0, 64, 'OUT', 'INVOICE', 9, 1.000, 3500.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:41:02', '2026-11-06 09:41:02'),
(70, 0, 65, 'OUT', 'INVOICE', 9, 1.000, 1300.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:41:02', '2026-11-06 09:41:02'),
(71, 0, 66, 'OUT', 'INVOICE', 9, 1.000, 1300.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:41:02', '2026-11-06 09:41:02'),
(72, 0, 67, 'OUT', 'INVOICE', 9, 1.000, 550.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:41:03', '2026-11-06 09:41:03'),
(73, 0, 68, 'OUT', 'INVOICE', 9, 1.000, 550.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:41:03', '2026-11-06 09:41:03'),
(74, 0, 69, 'OUT', 'INVOICE', 9, 1.000, 60000.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:41:03', '2026-11-06 09:41:03'),
(75, 1, 45, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:06', '2026-11-06 09:51:06'),
(76, 1, 46, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:06', '2026-11-06 09:51:06'),
(77, 1, 47, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:06', '2026-11-06 09:51:06'),
(78, 1, 48, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:07', '2026-11-06 09:51:07'),
(79, 1, 49, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:07', '2026-11-06 09:51:07'),
(80, 1, 50, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:07', '2026-11-06 09:51:07'),
(81, 1, 51, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:08', '2026-11-06 09:51:08'),
(82, 1, 52, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:08', '2026-11-06 09:51:08'),
(83, 1, 53, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:08', '2026-11-06 09:51:08'),
(84, 1, 54, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:08', '2026-11-06 09:51:08'),
(85, 1, 55, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:09', '2026-11-06 09:51:09'),
(86, 1, 62, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:09', '2026-11-06 09:51:09'),
(87, 1, 63, 'IN', 'ADJUSTMENT', 9, -1.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:09', '2026-11-06 09:51:09'),
(88, 1, 64, 'IN', 'ADJUSTMENT', 9, -1.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:10', '2026-11-06 09:51:10'),
(89, 1, 65, 'IN', 'ADJUSTMENT', 9, -1.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:10', '2026-11-06 09:51:10'),
(90, 1, 66, 'IN', 'ADJUSTMENT', 9, -1.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:10', '2026-11-06 09:51:10'),
(91, 1, 67, 'IN', 'ADJUSTMENT', 9, -1.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:11', '2026-11-06 09:51:11'),
(92, 1, 68, 'IN', 'ADJUSTMENT', 9, -1.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:11', '2026-11-06 09:51:11'),
(93, 1, 69, 'IN', 'ADJUSTMENT', 9, -1.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:11', '2026-11-06 09:51:11'),
(94, 0, 45, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:12', '2026-11-06 09:51:12'),
(95, 0, 46, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:12', '2026-11-06 09:51:12'),
(96, 0, 47, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:12', '2026-11-06 09:51:12'),
(97, 0, 48, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:12', '2026-11-06 09:51:12'),
(98, 0, 49, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:13', '2026-11-06 09:51:13'),
(99, 0, 50, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:13', '2026-11-06 09:51:13'),
(100, 0, 51, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:13', '2026-11-06 09:51:13'),
(101, 0, 52, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:14', '2026-11-06 09:51:14'),
(102, 0, 53, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:14', '2026-11-06 09:51:14'),
(103, 0, 54, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:14', '2026-11-06 09:51:14'),
(104, 0, 55, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:15', '2026-11-06 09:51:15'),
(105, 0, 62, 'IN', 'ADJUSTMENT', 9, -5.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:15', '2026-11-06 09:51:15'),
(106, 0, 64, 'IN', 'ADJUSTMENT', 9, -1.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:15', '2026-11-06 09:51:15'),
(107, 0, 65, 'IN', 'ADJUSTMENT', 9, -1.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:15', '2026-11-06 09:51:15'),
(108, 0, 66, 'IN', 'ADJUSTMENT', 9, -1.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:16', '2026-11-06 09:51:16'),
(109, 0, 67, 'IN', 'ADJUSTMENT', 9, -1.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:16', '2026-11-06 09:51:16'),
(110, 0, 68, 'IN', 'ADJUSTMENT', 9, -1.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:16', '2026-11-06 09:51:16'),
(111, 0, 69, 'IN', 'ADJUSTMENT', 9, -1.000, NULL, 'Reversal for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:17', '2026-11-06 09:51:17'),
(112, 0, 45, 'OUT', 'INVOICE', 9, 5.000, 500.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:28', '2026-11-06 09:51:28'),
(113, 0, 46, 'OUT', 'INVOICE', 9, 5.000, 500.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:29', '2026-11-06 09:51:29'),
(114, 0, 47, 'OUT', 'INVOICE', 9, 5.000, 300.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:29', '2026-11-06 09:51:29'),
(115, 0, 48, 'OUT', 'INVOICE', 9, 5.000, 450.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:29', '2026-11-06 09:51:29'),
(116, 0, 49, 'OUT', 'INVOICE', 9, 5.000, 450.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:29', '2026-11-06 09:51:29'),
(117, 0, 50, 'OUT', 'INVOICE', 9, 5.000, 600.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:30', '2026-11-06 09:51:30'),
(118, 0, 51, 'OUT', 'INVOICE', 9, 5.000, 600.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:30', '2026-11-06 09:51:30'),
(119, 0, 52, 'OUT', 'INVOICE', 9, 5.000, 450.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:30', '2026-11-06 09:51:30'),
(120, 0, 53, 'OUT', 'INVOICE', 9, 5.000, 500.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:31', '2026-11-06 09:51:31'),
(121, 0, 54, 'OUT', 'INVOICE', 9, 5.000, 1000.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:31', '2026-11-06 09:51:31'),
(122, 0, 55, 'OUT', 'INVOICE', 9, 5.000, 300.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:31', '2026-11-06 09:51:31'),
(123, 0, 62, 'OUT', 'INVOICE', 9, 5.000, 1800.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:32', '2026-11-06 09:51:32'),
(124, 0, 64, 'OUT', 'INVOICE', 9, 1.000, 3500.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:32', '2026-11-06 09:51:32'),
(125, 0, 65, 'OUT', 'INVOICE', 9, 1.000, 1300.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:32', '2026-11-06 09:51:32'),
(126, 0, 66, 'OUT', 'INVOICE', 9, 1.000, 1300.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:33', '2026-11-06 09:51:33'),
(127, 0, 67, 'OUT', 'INVOICE', 9, 1.000, 550.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:33', '2026-11-06 09:51:33'),
(128, 0, 68, 'OUT', 'INVOICE', 9, 1.000, 550.00, 'Stock reduction for updated invoice undefined', '2026-11-06', NULL, '2026-11-06 09:51:33', '2026-11-06 09:51:33'),
(129, 1, 70, 'OUT', 'INVOICE', 10, 1.000, 60000.00, 'Stock reduction for invoice INV-06112026-24', '2026-11-06', NULL, '2026-11-06 09:56:09', '2026-11-06 09:56:09'),
(130, 1, 77, 'OUT', 'INVOICE', 11, 1.000, 5000.00, 'Stock reduction for invoice INV-17112026-25 (converted from quotation QT-17112026-23)', '2026-11-17', NULL, '2026-11-17 19:30:54', '2026-11-17 19:30:54'),
(131, 1, 79, 'OUT', 'INVOICE', 11, 1.000, 2500.00, 'Stock reduction for invoice INV-17112026-25 (converted from quotation QT-17112026-23)', '2026-11-17', NULL, '2026-11-17 19:30:55', '2026-11-17 19:30:55'),
(132, 1, 80, 'OUT', 'INVOICE', 11, 1.000, 3500.00, 'Stock reduction for invoice INV-17112026-25 (converted from quotation QT-17112026-23)', '2026-11-17', NULL, '2026-11-17 19:30:55', '2026-11-17 19:30:55'),
(133, 1, 81, 'OUT', 'INVOICE', 11, 1.000, 3500.00, 'Stock reduction for invoice INV-17112026-25 (converted from quotation QT-17112026-23)', '2026-11-17', NULL, '2026-11-17 19:30:56', '2026-11-17 19:30:56'),
(134, 1, 82, 'OUT', 'INVOICE', 11, 1.000, 500.00, 'Stock reduction for invoice INV-17112026-25 (converted from quotation QT-17112026-23)', '2026-11-17', NULL, '2026-11-17 19:30:56', '2026-11-17 19:30:56'),
(135, 1, 85, 'OUT', 'INVOICE', 11, 1.000, 300.00, 'Stock reduction for invoice INV-17112026-25 (converted from quotation QT-17112026-23)', '2026-11-17', NULL, '2026-11-17 19:30:56', '2026-11-17 19:30:56'),
(136, 1, 86, 'OUT', 'INVOICE', 11, 1.000, 150.00, 'Stock reduction for invoice INV-17112026-25 (converted from quotation QT-17112026-23)', '2026-11-17', NULL, '2026-11-17 19:30:57', '2026-11-17 19:30:57');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `contact_person` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_terms` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tax_settings`
--

CREATE TABLE `tax_settings` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `rate` decimal(6,3) DEFAULT '0.000',
  `is_active` tinyint(1) DEFAULT '1',
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transport_finance`
--

CREATE TABLE `transport_finance` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `vehicle_id` int NOT NULL,
  `material_id` int NOT NULL,
  `buying_price` decimal(12,2) DEFAULT '0.00',
  `fuel_cost` decimal(12,2) DEFAULT '0.00',
  `driver_fees` decimal(12,2) DEFAULT '0.00',
  `other_expenses` decimal(12,2) DEFAULT '0.00',
  `selling_price` decimal(12,2) DEFAULT '0.00',
  `profit_loss` decimal(12,2) DEFAULT '0.00',
  `payment_status` enum('unpaid','paid','pending') DEFAULT 'unpaid',
  `customer_name` varchar(150) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Triggers `transport_finance`
--
DELIMITER $$
CREATE TRIGGER `trg_transport_finance_insert` BEFORE INSERT ON `transport_finance` FOR EACH ROW BEGIN
    SET NEW.profit_loss =
        NEW.selling_price -
        (NEW.buying_price + NEW.fuel_cost + NEW.driver_fees + NEW.other_expenses);
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_transport_finance_update` BEFORE UPDATE ON `transport_finance` FOR EACH ROW BEGIN
    SET NEW.profit_loss =
        NEW.selling_price -
        (NEW.buying_price + NEW.fuel_cost + NEW.driver_fees + NEW.other_expenses);
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `transport_finance_summary`
--

CREATE TABLE `transport_finance_summary` (
  `id` int DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `vehicle_number` varchar(50) DEFAULT NULL,
  `material_name` varchar(150) DEFAULT NULL,
  `selling_price` decimal(12,2) DEFAULT NULL,
  `profit_loss` decimal(12,2) DEFAULT NULL,
  `payment_status` enum('unpaid','paid','pending') DEFAULT NULL,
  `date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transport_payments`
--

CREATE TABLE `transport_payments` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `trip_id` int NOT NULL,
  `payment_amount` decimal(15,2) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'cash',
  `reference_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `recorded_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `role`, `created_at`) VALUES
(1, 'info@diagsolutionsltd.com', '$2y$10$eYFzTQxfxCX1Xh5WCAabwevEA1x5rpxY3HtOaoujKAmRybK1gnc3G', 'admin', '2026-01-04 12:59:22'),
(2, 'test@example.com', '$2y$10$eYFzTQxfxCX1Xh5WCAabwevEA1x5rpxY3HtOaoujKAmRybK1gnc3G', 'accountant', '2026-01-05 12:22:24');

-- --------------------------------------------------------

--
-- Table structure for table `user_invitations`
--

CREATE TABLE `user_invitations` (
  `id` int NOT NULL,
  `email` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `company_id` int NOT NULL,
  `invited_by` int DEFAULT NULL,
  `invited_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `is_approved` tinyint(1) DEFAULT '0',
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `invitation_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_permissions`
--

CREATE TABLE `user_permissions` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `permission_name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `granted` tinyint(1) DEFAULT '1',
  `granted_by` int DEFAULT NULL,
  `granted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `variant_images`
--

CREATE TABLE `variant_images` (
  `id` int NOT NULL,
  `variant_id` int NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alt_text` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vehicles`
--

CREATE TABLE `vehicles` (
  `id` int NOT NULL,
  `company_id` int NOT NULL,
  `vehicle_number` varchar(50) NOT NULL,
  `vehicle_type` varchar(50) DEFAULT NULL,
  `capacity` decimal(10,2) DEFAULT NULL,
  `status` enum('active','inactive','maintenance') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `web_app_leads`
--

CREATE TABLE `web_app_leads` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `web_categories`
--

CREATE TABLE `web_categories` (
  `id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `icon` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `web_categories`
--

INSERT INTO `web_categories` (`id`, `name`, `slug`, `is_active`, `created_at`, `icon`, `description`, `image_path`, `display_order`, `updated_at`) VALUES
(1, 'Laboratory', 'laboratory', 1, '2026-11-20 12:22:30', '🔬', 'Clinical laboratory testing - hematology, chemistry, microbiology and immunology services.', NULL, 1, '2026-11-20 12:22:30'),
(2, 'Imaging', 'imaging', 1, '2026-11-20 12:22:30', '🩻', 'Diagnostic imaging services - CT scan, X-Ray and ultrasound.', NULL, 2, '2026-11-20 12:22:30');

-- --------------------------------------------------------

--
-- Table structure for table `web_variants`
--

CREATE TABLE `web_variants` (
  `id` int NOT NULL,
  `category_id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `web_variants`
--

INSERT INTO `web_variants` (`id`, `category_id`, `name`, `sku`, `is_active`, `created_at`, `slug`, `description`, `image_path`, `display_order`, `updated_at`) VALUES
(1, 2, 'CT Scan', 'IMG-CT-001', 1, '2026-11-20 12:22:30', 'ct-scan', 'Computed tomography scanning for detailed cross-sectional images.', NULL, 1, '2026-11-20 12:22:30'),
(2, 2, 'Ultrasound', 'IMG-US-001', 1, '2026-11-20 12:22:30', 'ultrasound', 'Diagnostic ultrasound imaging including obstetric and abdominal.', NULL, 3, '2026-11-20 12:22:30'),
(3, 2, 'X-Ray', 'IMG-XR-001', 1, '2026-11-20 12:22:30', 'x-ray', 'Digital radiography for bone, chest and abdominal imaging.', NULL, 2, '2026-11-20 12:22:30'),
(4, 1, 'Chemistry', 'LAB-CHEM-001', 1, '2026-11-20 12:22:30', 'chemistry', 'Clinical chemistry, biochemistry and therapeutic drug monitoring.', NULL, 2, '2026-11-20 12:22:30'),
(5, 1, 'Hematology', 'LAB-HEM-001', 1, '2026-11-20 12:22:30', 'hematology', 'Blood counts, coagulation and morphology testing.', NULL, 1, '2026-11-20 12:22:30'),
(6, 1, 'Immunology', 'LAB-IMM-001', 1, '2026-11-20 12:22:30', 'immunology', 'Serology, immunology and allergy testing.', NULL, 4, '2026-11-20 12:22:30'),
(7, 1, 'Microbiology', 'LAB-MICRO-001', 1, '2026-11-20 12:22:30', 'microbiology', 'Culture, sensitivity and infectious disease diagnostics.', NULL, 3, '2026-11-20 12:22:30');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `contacts`
--
ALTER TABLE `contacts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `credit_notes`
--
ALTER TABLE `credit_notes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `credit_note_allocations`
--
ALTER TABLE `credit_note_allocations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `credit_note_items`
--
ALTER TABLE `credit_note_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_customers_company` (`company_id`);

--
-- Indexes for table `delivery_notes`
--
ALTER TABLE `delivery_notes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `delivery_note_number` (`delivery_note_number`);

--
-- Indexes for table `delivery_note_items`
--
ALTER TABLE `delivery_note_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `discovery_leads`
--
ALTER TABLE `discovery_leads`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `document_sequences`
--
ALTER TABLE `document_sequences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_type_year` (`document_type`,`year`),
  ADD KEY `idx_document_sequences_type` (`document_type`);

--
-- Indexes for table `drivers`
--
ALTER TABLE `drivers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_drivers_company` (`company_id`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `fk_invoices_customer` (`customer_id`);

--
-- Indexes for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_invoice_items_invoice` (`invoice_id`);

--
-- Indexes for table `leads`
--
ALTER TABLE `leads`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `logs`
--
ALTER TABLE `logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `lpos`
--
ALTER TABLE `lpos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `lpo_number` (`lpo_number`);

--
-- Indexes for table `lpo_items`
--
ALTER TABLE `lpo_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `materials`
--
ALTER TABLE `materials`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_material_per_company` (`company_id`,`name`),
  ADD KEY `idx_materials_company` (`company_id`);

--
-- Indexes for table `migration_logs`
--
ALTER TABLE `migration_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `newsletter`
--
ALTER TABLE `newsletter`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `opportunities`
--
ALTER TABLE `opportunities`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payment_number` (`payment_number`);

--
-- Indexes for table `payment_allocations`
--
ALTER TABLE `payment_allocations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payment_audit_log`
--
ALTER TABLE `payment_audit_log`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `portfolios`
--
ALTER TABLE `portfolios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `website_url` (`website_url`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD KEY `fk_products_company` (`company_id`);

--
-- Indexes for table `product_categories`
--
ALTER TABLE `product_categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `profiles`
--
ALTER TABLE `profiles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_profiles_company` (`company_id`);

--
-- Indexes for table `proforma_invoices`
--
ALTER TABLE `proforma_invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `proforma_number` (`proforma_number`);

--
-- Indexes for table `proforma_items`
--
ALTER TABLE `proforma_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `quotations`
--
ALTER TABLE `quotations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_customer_id` (`customer_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `quotation_items`
--
ALTER TABLE `quotation_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `receipts`
--
ALTER TABLE `receipts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_receipt_number` (`company_id`,`receipt_number`),
  ADD KEY `change_note_id` (`change_note_id`),
  ADD KEY `idx_receipts_company_id` (`company_id`),
  ADD KEY `idx_receipts_payment_id` (`payment_id`),
  ADD KEY `idx_receipts_invoice_id` (`invoice_id`),
  ADD KEY `idx_receipts_receipt_number` (`receipt_number`),
  ADD KEY `idx_receipts_receipt_date` (`receipt_date`),
  ADD KEY `idx_receipts_receipt_type` (`receipt_type`),
  ADD KEY `idx_receipts_excess_handling` (`excess_handling`),
  ADD KEY `idx_receipts_created_at` (`created_at` DESC);

--
-- Indexes for table `receipt_items`
--
ALTER TABLE `receipt_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_receipt_items_receipt_id` (`receipt_id`),
  ADD KEY `idx_receipt_items_product_id` (`product_id`);

--
-- Indexes for table `remittance_advice`
--
ALTER TABLE `remittance_advice`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `remittance_number` (`remittance_number`);

--
-- Indexes for table `remittance_advice_items`
--
ALTER TABLE `remittance_advice_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_roles_company` (`company_id`);

--
-- Indexes for table `stock_movements`
--
ALTER TABLE `stock_movements`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tax_settings`
--
ALTER TABLE `tax_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `transport_finance`
--
ALTER TABLE `transport_finance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_finance_company` (`company_id`),
  ADD KEY `idx_finance_vehicle` (`vehicle_id`),
  ADD KEY `idx_finance_material` (`material_id`);

--
-- Indexes for table `transport_payments`
--
ALTER TABLE `transport_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_trip_id` (`trip_id`),
  ADD KEY `idx_payment_date` (`payment_date`),
  ADD KEY `idx_payment_method` (`payment_method`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_invitations`
--
ALTER TABLE `user_invitations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `variant_images`
--
ALTER TABLE `variant_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_variant_images_variant_id` (`variant_id`);

--
-- Indexes for table `vehicles`
--
ALTER TABLE `vehicles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_vehicle_per_company` (`company_id`,`vehicle_number`),
  ADD KEY `idx_vehicles_company` (`company_id`);

--
-- Indexes for table `web_app_leads`
--
ALTER TABLE `web_app_leads`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `web_categories`
--
ALTER TABLE `web_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `web_variants`
--
ALTER TABLE `web_variants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `contacts`
--
ALTER TABLE `contacts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `credit_notes`
--
ALTER TABLE `credit_notes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `credit_note_allocations`
--
ALTER TABLE `credit_note_allocations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `credit_note_items`
--
ALTER TABLE `credit_note_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `delivery_notes`
--
ALTER TABLE `delivery_notes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_note_items`
--
ALTER TABLE `delivery_note_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `discovery_leads`
--
ALTER TABLE `discovery_leads`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `document_sequences`
--
ALTER TABLE `document_sequences`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `drivers`
--
ALTER TABLE `drivers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `invoice_items`
--
ALTER TABLE `invoice_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- AUTO_INCREMENT for table `leads`
--
ALTER TABLE `leads`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `logs`
--
ALTER TABLE `logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lpos`
--
ALTER TABLE `lpos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lpo_items`
--
ALTER TABLE `lpo_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `materials`
--
ALTER TABLE `materials`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migration_logs`
--
ALTER TABLE `migration_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `newsletter`
--
ALTER TABLE `newsletter`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `opportunities`
--
ALTER TABLE `opportunities`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `payment_allocations`
--
ALTER TABLE `payment_allocations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `payment_audit_log`
--
ALTER TABLE `payment_audit_log`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_methods`
--
ALTER TABLE `payment_methods`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `portfolios`
--
ALTER TABLE `portfolios`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=87;

--
-- AUTO_INCREMENT for table `product_categories`
--
ALTER TABLE `product_categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `profiles`
--
ALTER TABLE `profiles`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `proforma_invoices`
--
ALTER TABLE `proforma_invoices`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `proforma_items`
--
ALTER TABLE `proforma_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `quotations`
--
ALTER TABLE `quotations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `quotation_items`
--
ALTER TABLE `quotation_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=505;

--
-- AUTO_INCREMENT for table `receipts`
--
ALTER TABLE `receipts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT COMMENT 'Primary key', AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `receipt_items`
--
ALTER TABLE `receipt_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `remittance_advice`
--
ALTER TABLE `remittance_advice`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `remittance_advice_items`
--
ALTER TABLE `remittance_advice_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=900496;

--
-- AUTO_INCREMENT for table `stock_movements`
--
ALTER TABLE `stock_movements`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=138;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tax_settings`
--
ALTER TABLE `tax_settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transport_finance`
--
ALTER TABLE `transport_finance`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transport_payments`
--
ALTER TABLE `transport_payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `user_invitations`
--
ALTER TABLE `user_invitations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_permissions`
--
ALTER TABLE `user_permissions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `variant_images`
--
ALTER TABLE `variant_images`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vehicles`
--
ALTER TABLE `vehicles`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `web_app_leads`
--
ALTER TABLE `web_app_leads`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `web_categories`
--
ALTER TABLE `web_categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `web_variants`
--
ALTER TABLE `web_variants`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `receipt_items`
--
ALTER TABLE `receipt_items`
  ADD CONSTRAINT `fk_receipt_items_receipt` FOREIGN KEY (`receipt_id`) REFERENCES `receipts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `variant_images`
--
ALTER TABLE `variant_images`
  ADD CONSTRAINT `fk_variant_images_variant` FOREIGN KEY (`variant_id`) REFERENCES `web_variants` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- Power Panels & Electrical — Quote Tool
-- Database: powerpanelsshopc_quotetool
-- Run this once to create all tables.

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- ─────────────────────────────────────────────
-- Users
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(60)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(120) NOT NULL,
  role          ENUM('admin','estimator') NOT NULL DEFAULT 'estimator',
  active        TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- Customers
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(200) NOT NULL,
  contact_person VARCHAR(120),
  phone          VARCHAR(40),
  email          VARCHAR(150),
  address        TEXT,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- Quotes
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotes (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quote_number   VARCHAR(30)  NOT NULL UNIQUE,
  customer_id    INT UNSIGNED,
  project_name   VARCHAR(250) NOT NULL,
  site_location  VARCHAR(250),
  estimator_id   INT UNSIGNED,
  quote_date     DATE NOT NULL,
  validity_days  SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  currency       CHAR(3) NOT NULL DEFAULT 'ZAR',
  vat_rate       DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  notes          TEXT,
  exclusions     TEXT,
  terms          TEXT,
  status         ENUM('draft','sent','won','lost') NOT NULL DEFAULT 'draft',
  pdf_format     ENUM('grouped','itemised','summary','per_panel') NOT NULL DEFAULT 'grouped',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id)  REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (estimator_id) REFERENCES users(id)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- BOM Line Items
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quote_panels (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quote_id    INT UNSIGNED NOT NULL,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  qty         SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- BOM Line Items
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quote_bom (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quote_id        INT UNSIGNED NOT NULL,
  panel_id        INT UNSIGNED NULL,
  pricing_item_id INT UNSIGNED NULL,          -- NULL = custom/manual line
  item_code       VARCHAR(80)  NOT NULL,
  description     TEXT         NOT NULL,
  category        VARCHAR(40)  NOT NULL DEFAULT 'misc',
  supplier        VARCHAR(100),
  unit            VARCHAR(20)  NOT NULL DEFAULT 'ea',
  qty             DECIMAL(10,3) NOT NULL DEFAULT 1,
  cost_price      DECIMAL(12,2) NOT NULL DEFAULT 0,
  markup_pct      DECIMAL(6,2)  NOT NULL DEFAULT 30,
  notes           TEXT,
  price_overridden TINYINT(1) NOT NULL DEFAULT 0,
  sort_order      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- Labour Lines
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quote_labour (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quote_id    INT UNSIGNED NOT NULL,
  panel_id    INT UNSIGNED NULL,
  category    VARCHAR(100) NOT NULL,
  skill_level VARCHAR(50)  NOT NULL DEFAULT 'Skilled',
  hours       DECIMAL(8,2) NOT NULL DEFAULT 0,
  rate        DECIMAL(8,2) NOT NULL DEFAULT 0,
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- Copper Fabrication Runs
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quote_copper (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quote_id     INT UNSIGNED NOT NULL,
  panel_id     INT UNSIGNED NULL,
  name         VARCHAR(120) NOT NULL DEFAULT 'Main busbar run',
  width_mm     DECIMAL(8,2) NOT NULL DEFAULT 40,
  height_mm    DECIMAL(8,2) NOT NULL DEFAULT 10,
  length_m     DECIMAL(8,3) NOT NULL DEFAULT 1,
  qty          SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  price_per_m  DECIMAL(10,2) NOT NULL DEFAULT 358,
  waste_pct    DECIMAL(5,2)  NOT NULL DEFAULT 12,
  fab_hours    DECIMAL(8,2)  NOT NULL DEFAULT 0,
  fab_rate     DECIMAL(8,2)  NOT NULL DEFAULT 520,
  tinned       TINYINT(1)    NOT NULL DEFAULT 1,
  markup_pct   DECIMAL(6,2)  NOT NULL DEFAULT 35,
  sort_order   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- Pricing Database (master item catalogue)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pricing_items (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_code       VARCHAR(80)   NOT NULL UNIQUE,
  description     TEXT          NOT NULL,
  category        VARCHAR(40)   NOT NULL DEFAULT 'misc',
  supplier        VARCHAR(100),
  unit            VARCHAR(20)   NOT NULL DEFAULT 'ea',
  cost_price      DECIMAL(12,2) NOT NULL DEFAULT 0,
  sell_price      DECIMAL(12,2) NULL,
  default_markup  DECIMAL(6,2)  NOT NULL DEFAULT 30,
  lead_time       VARCHAR(60),
  stock_status    VARCHAR(40),
  active          TINYINT(1)    NOT NULL DEFAULT 1,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─────────────────────────────────────────────
-- Settings (key/value store for rates, etc.)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  `key`       VARCHAR(80) NOT NULL PRIMARY KEY,
  `value`     TEXT,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET foreign_key_checks = 1;

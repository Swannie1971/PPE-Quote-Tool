-- Migration: Add Panels support
-- Run this in phpMyAdmin on your EXISTING database (if schema.sql was already applied)
-- Safe to run multiple times — CREATE TABLE IF NOT EXISTS won't duplicate.

-- 1. New panels table
CREATE TABLE IF NOT EXISTS quote_panels (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quote_id    INT UNSIGNED NOT NULL,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  qty         SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Add panel_id column to BOM, labour, copper (ignore error if already exists)
ALTER TABLE quote_bom    ADD COLUMN panel_id INT UNSIGNED NULL AFTER quote_id;
ALTER TABLE quote_labour ADD COLUMN panel_id INT UNSIGNED NULL AFTER quote_id;
ALTER TABLE quote_copper ADD COLUMN panel_id INT UNSIGNED NULL AFTER quote_id;

-- 3. Allow per_panel as a pdf_format value
ALTER TABLE quotes MODIFY COLUMN pdf_format ENUM('grouped','itemised','summary','per_panel') NOT NULL DEFAULT 'grouped';

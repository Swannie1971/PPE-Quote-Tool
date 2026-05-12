-- Add updated_by tracking to quotes (revision history)
ALTER TABLE quotes
    ADD COLUMN updated_by INT UNSIGNED NULL AFTER updated_at,
    ADD CONSTRAINT fk_quotes_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL;

-- Add soft-delete support to customers
ALTER TABLE customers
    ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1 AFTER address;

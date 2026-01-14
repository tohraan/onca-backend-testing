-- Migration: 006_currency_normalization
-- Description: Add support for tracking original source currency and exchange rates

ALTER TABLE master_transactions 
ADD COLUMN IF NOT EXISTS source_amount DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS source_currency TEXT,
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(15, 6);

-- Backfill existing data if needed (assuming current amount/currency were the source)
UPDATE master_transactions 
SET source_amount = amount, 
    source_currency = currency 
WHERE source_amount IS NULL;

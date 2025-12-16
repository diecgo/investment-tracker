-- Add columns for Multi-Currency Support (USD, etc.)

ALTER TABLE investments 
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS buy_price_original numeric, -- The price in the original currency (e.g. $150)
ADD COLUMN IF NOT EXISTS exchange_rate_opening numeric DEFAULT 1, -- The rate at purchase (e.g. 0.90 USD->EUR)
ADD COLUMN IF NOT EXISTS exchange_rate_current numeric DEFAULT 1; -- The current rate (updated daily/manually)

-- Update existing records to default 'EUR' behavior
UPDATE investments 
SET 
  currency = 'EUR',
  buy_price_original = buy_price,
  exchange_rate_opening = 1,
  exchange_rate_current = 1
WHERE currency IS NULL;

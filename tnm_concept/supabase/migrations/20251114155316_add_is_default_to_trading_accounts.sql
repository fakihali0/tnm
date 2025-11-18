-- Add is_default column to trading_accounts table for default account selection
-- This allows users to set a default account for positions display

-- Add the is_default column
ALTER TABLE public.trading_accounts 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Create an index for faster queries on default accounts
CREATE INDEX IF NOT EXISTS idx_trading_accounts_is_default 
ON public.trading_accounts(user_id, is_default) 
WHERE is_default = true;

-- Add a comment explaining the column
COMMENT ON COLUMN public.trading_accounts.is_default IS 'Indicates if this is the default account for positions display. Only one account per user should be default.';

-- Function to ensure only one default account per user
CREATE OR REPLACE FUNCTION ensure_single_default_account()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this account as default, unset all other defaults for this user
  IF NEW.is_default = true THEN
    UPDATE public.trading_accounts 
    SET is_default = false 
    WHERE user_id = NEW.user_id 
    AND id != NEW.id 
    AND is_default = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain single default account per user
DROP TRIGGER IF EXISTS enforce_single_default_account ON public.trading_accounts;
CREATE TRIGGER enforce_single_default_account
  BEFORE INSERT OR UPDATE ON public.trading_accounts
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_account();

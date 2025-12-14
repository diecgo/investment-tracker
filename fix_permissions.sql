-- FIX: Enable users to delete their own transactions
-- Run this in your Supabase SQL Editor

CREATE POLICY "Users can delete own transactions" 
ON transactions 
FOR DELETE 
USING (auth.uid() = user_id);

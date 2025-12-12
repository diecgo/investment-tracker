-- Add username column to profiles table
alter table profiles 
add column username text;

-- Policy to allow users to update their own username
-- (This policy might already exist "Users can update own profile", but good to verify RLS allows meaningful updates)
-- No changes needed to policies if "Users can update own profile" is broad enough.

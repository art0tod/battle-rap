BEGIN;

ALTER TABLE IF EXISTS public.app_user_role
  ADD COLUMN IF NOT EXISTS role user_role;

-- Ensure primary key uses the role column if the table was created without it
ALTER TABLE IF EXISTS public.app_user_role
  DROP CONSTRAINT IF EXISTS app_user_role_pkey;

ALTER TABLE IF EXISTS public.app_user_role
  ADD CONSTRAINT app_user_role_pkey PRIMARY KEY (user_id, role);

COMMIT;

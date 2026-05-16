ALTER TABLE public.developer_profiles
  ADD COLUMN IF NOT EXISTS years_of_experience    integer,
  ADD COLUMN IF NOT EXISTS target_roles           text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_company_types text[] DEFAULT '{}';

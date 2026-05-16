ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nickname text;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_market_check;

UPDATE public.profiles
SET nickname = COALESCE(nickname, split_part(auth_users.email, '@', 1))
FROM auth.users AS auth_users
WHERE profiles.user_id = auth_users.id
  AND profiles.nickname IS NULL;

UPDATE public.profiles
SET role = 'employee'
WHERE role = 'developer';

UPDATE public.profiles
SET market = CASE
  WHEN market = 'KR' THEN 'KR_TO_JP'
  WHEN market = 'JP' THEN 'JP_TO_KR'
  ELSE market
END;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('employee', 'employer'));

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_market_check CHECK (market IN ('KR_TO_JP', 'JP_TO_KR'));

ALTER TABLE public.profiles
  ALTER COLUMN nickname SET NOT NULL;

CREATE TABLE IF NOT EXISTS public.employee_profiles (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  profile_id bigint REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name text NOT NULL,
  birth_date date NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  nationality text NOT NULL CHECK (nationality IN ('korean', 'japanese')),
  years_of_experience integer NOT NULL CHECK (years_of_experience >= 0),
  target_roles text[] NOT NULL CHECK (array_length(target_roles, 1) >= 1),
  tech_stack text[] NOT NULL CHECK (array_length(tech_stack, 1) >= 1),
  language_certifications text NOT NULL,
  preferred_salary_min bigint NOT NULL CHECK (preferred_salary_min >= 0),
  preferred_salary_max bigint NOT NULL CHECK (preferred_salary_max >= preferred_salary_min),
  preferred_currency text NOT NULL CHECK (preferred_currency IN ('KRW', 'JPY')),
  preferred_locations text[] NOT NULL CHECK (array_length(preferred_locations, 1) >= 1),
  preferred_company_types text[] NOT NULL CHECK (array_length(preferred_company_types, 1) >= 1),
  work_style_preference text NOT NULL CHECK (work_style_preference IN ('remote', 'hybrid', 'onsite', 'any')),
  relocation_available boolean NOT NULL,
  visa_support_needed boolean NOT NULL,
  self_introduction text NOT NULL,
  key_project_experience text NOT NULL,
  motivation text NOT NULL,
  concerns text NOT NULL,
  github_url text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.employer_profiles (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  profile_id bigint REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  company_id text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

INSERT INTO public.employee_profiles (
  profile_id,
  full_name,
  birth_date,
  gender,
  nationality,
  years_of_experience,
  target_roles,
  tech_stack,
  language_certifications,
  preferred_salary_min,
  preferred_salary_max,
  preferred_currency,
  preferred_locations,
  preferred_company_types,
  work_style_preference,
  relocation_available,
  visa_support_needed,
  self_introduction,
  key_project_experience,
  motivation,
  concerns,
  github_url
)
SELECT
  dp.profile_id,
  COALESCE(NULLIF(dp.full_name, ''), split_part(au.email, '@', 1), 'Unknown'),
  DATE '2000-01-01',
  'male',
  CASE
    WHEN lower(COALESCE(dp.nationality, '')) IN ('japanese', 'japan', '일본', '日本') THEN 'japanese'
    ELSE 'korean'
  END,
  GREATEST(COALESCE(dp.years_of_experience, 0), 0),
  CASE
    WHEN array_length(dp.target_roles, 1) >= 1 THEN dp.target_roles
    WHEN NULLIF(dp.target_role, '') IS NOT NULL THEN ARRAY[dp.target_role]
    ELSE ARRAY['Software Engineer']
  END,
  CASE
    WHEN array_length(dp.tech_stack, 1) >= 1 THEN dp.tech_stack
    ELSE ARRAY['Not provided']
  END,
  CASE
    WHEN jsonb_typeof(dp.language_certifications) = 'array' THEN dp.language_certifications::text
    ELSE '[]'
  END,
  GREATEST(COALESCE(dp.preferred_salary_min, 0), 0),
  GREATEST(COALESCE(dp.preferred_salary_max, dp.preferred_salary_min, 0), COALESCE(dp.preferred_salary_min, 0), 0),
  CASE
    WHEN dp.preferred_currency IN ('KRW', 'JPY') THEN dp.preferred_currency
    ELSE 'JPY'
  END,
  CASE
    WHEN array_length(dp.preferred_locations, 1) >= 1 THEN dp.preferred_locations
    ELSE ARRAY['Tokyo']
  END,
  CASE
    WHEN array_length(dp.preferred_company_types, 1) >= 1 THEN dp.preferred_company_types
    ELSE ARRAY['General']
  END,
  COALESCE(dp.work_style_preference, 'any'),
  COALESCE(dp.relocation_available, false),
  COALESCE(dp.visa_support_needed, false),
  COALESCE(NULLIF(dp.self_introduction, ''), 'Profile migrated from legacy developer profile.'),
  COALESCE(NULLIF(dp.key_project_experience, ''), 'Profile migrated from legacy developer profile.'),
  COALESCE(NULLIF(dp.motivation, ''), 'Profile migrated from legacy developer profile.'),
  COALESCE(array_to_string(dp.concerns, ', '), ''),
  COALESCE(NULLIF(dp.github_url, ''), '')
FROM public.developer_profiles AS dp
JOIN public.profiles AS p ON p.id = dp.profile_id
LEFT JOIN auth.users AS au ON au.id = p.user_id
ON CONFLICT (profile_id) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  birth_date = EXCLUDED.birth_date,
  gender = EXCLUDED.gender,
  nationality = EXCLUDED.nationality,
  years_of_experience = EXCLUDED.years_of_experience,
  target_roles = EXCLUDED.target_roles,
  tech_stack = EXCLUDED.tech_stack,
  language_certifications = EXCLUDED.language_certifications,
  preferred_salary_min = EXCLUDED.preferred_salary_min,
  preferred_salary_max = EXCLUDED.preferred_salary_max,
  preferred_currency = EXCLUDED.preferred_currency,
  preferred_locations = EXCLUDED.preferred_locations,
  preferred_company_types = EXCLUDED.preferred_company_types,
  work_style_preference = EXCLUDED.work_style_preference,
  relocation_available = EXCLUDED.relocation_available,
  visa_support_needed = EXCLUDED.visa_support_needed,
  self_introduction = EXCLUDED.self_introduction,
  key_project_experience = EXCLUDED.key_project_experience,
  motivation = EXCLUDED.motivation,
  concerns = EXCLUDED.concerns,
  github_url = EXCLUDED.github_url;

INSERT INTO public.employer_profiles (profile_id, company_id)
SELECT id, 'mercari'
FROM public.profiles
WHERE role = 'employer'
ON CONFLICT (profile_id) DO NOTHING;

DROP TABLE IF EXISTS public.cvs CASCADE;
DROP TABLE IF EXISTS public.developer_profiles CASCADE;
DROP TABLE IF EXISTS public.company_job_profiles CASCADE;
DROP TABLE IF EXISTS public.company_evaluation_rubrics CASCADE;
DROP TABLE IF EXISTS public.company_hiring_signals CASCADE;
DROP TABLE IF EXISTS public.resume_context_mappings CASCADE;

DROP TRIGGER IF EXISTS update_employee_profiles_updated_at ON public.employee_profiles;
CREATE TRIGGER update_employee_profiles_updated_at
  BEFORE UPDATE ON public.employee_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

DROP TRIGGER IF EXISTS update_employer_profiles_updated_at ON public.employer_profiles;
CREATE TRIGGER update_employer_profiles_updated_at
  BEFORE UPDATE ON public.employer_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS employee_profiles_select_all ON public.employee_profiles;
CREATE POLICY "employee_profiles_select_all" ON public.employee_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS employee_profiles_update_own ON public.employee_profiles;
CREATE POLICY "employee_profiles_update_own" ON public.employee_profiles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS employee_profiles_insert_own ON public.employee_profiles;
CREATE POLICY "employee_profiles_insert_own" ON public.employee_profiles FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS employer_profiles_select_all ON public.employer_profiles;
CREATE POLICY "employer_profiles_select_all" ON public.employer_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS employer_profiles_update_own ON public.employer_profiles;
CREATE POLICY "employer_profiles_update_own" ON public.employer_profiles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS employer_profiles_insert_own ON public.employer_profiles;
CREATE POLICY "employer_profiles_insert_own" ON public.employer_profiles FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid()
  ));

GRANT SELECT, INSERT, UPDATE ON public.employee_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.employer_profiles TO authenticated;
GRANT SELECT ON public.employee_profiles TO anon;
GRANT SELECT ON public.employer_profiles TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_profile_id bigint;
BEGIN
  INSERT INTO public.profiles (user_id, role, market, nickname)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
    COALESCE(NEW.raw_user_meta_data->>'market', 'KR_TO_JP'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'nickname', ''), split_part(NEW.email, '@', 1))
  )
  RETURNING id INTO new_profile_id;

  IF COALESCE(NEW.raw_user_meta_data->>'role', 'employee') = 'employer' THEN
    INSERT INTO public.employer_profiles (profile_id, company_id)
    VALUES (new_profile_id, COALESCE(NULLIF(NEW.raw_user_meta_data->>'companyId', ''), 'mercari'));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

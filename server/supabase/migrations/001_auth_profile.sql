-- profiles: one row per auth.users row
CREATE TABLE public.profiles (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role       text NOT NULL CHECK (role IN ('developer', 'employer')),
  market     text NOT NULL CHECK (market IN ('KR', 'JP')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- developer_profiles: extended info for developer accounts
CREATE TABLE public.developer_profiles (
  id                     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  profile_id             bigint REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name              text,
  nationality            text,
  target_country         text,
  target_role            text,
  tech_stack             text[] DEFAULT '{}',
  target_language_level  text,
  portfolio_url          text,
  github_url             text,
  self_introduction      text,
  key_project_experience text,
  created_at             timestamptz DEFAULT now() NOT NULL,
  updated_at             timestamptz DEFAULT now() NOT NULL
);

-- cvs: structured CV sections, FK on cvs side for future 1:N versioning
CREATE TABLE public.cvs (
  id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  developer_profile_id  bigint REFERENCES public.developer_profiles(id) ON DELETE CASCADE NOT NULL,
  contents              jsonb DEFAULT '[]'::jsonb NOT NULL,
  created_at            timestamptz DEFAULT now() NOT NULL,
  updated_at            timestamptz DEFAULT now() NOT NULL
);

-- shared updated_at function (used by all tables)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

CREATE TRIGGER update_developer_profiles_updated_at
  BEFORE UPDATE ON public.developer_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

CREATE TRIGGER update_cvs_updated_at
  BEFORE UPDATE ON public.cvs
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

-- auto-create profile + developer_profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_profile_id bigint;
BEGIN
  INSERT INTO public.profiles (user_id, role, market)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'developer'),
    COALESCE(NEW.raw_user_meta_data->>'market', 'KR')
  )
  RETURNING id INTO new_profile_id;

  IF COALESCE(NEW.raw_user_meta_data->>'role', 'developer') = 'developer' THEN
    INSERT INTO public.developer_profiles (profile_id)
    VALUES (new_profile_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

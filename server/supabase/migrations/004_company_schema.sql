-- ── developer_profiles: replace target_language_level with language_certifications + preference columns ──
ALTER TABLE public.developer_profiles
  DROP COLUMN IF EXISTS target_language_level,
  ADD COLUMN language_certifications   jsonb    DEFAULT '[]'::jsonb,
  ADD COLUMN preferred_salary_min      bigint,
  ADD COLUMN preferred_salary_max      bigint,
  ADD COLUMN preferred_currency        text     CHECK (preferred_currency IN ('JPY', 'KRW', 'USD')),
  ADD COLUMN preferred_locations       text[]   DEFAULT '{}',
  ADD COLUMN work_style_preference     text     CHECK (work_style_preference IN ('remote', 'hybrid', 'onsite', 'any')),
  ADD COLUMN relocation_available      boolean  DEFAULT false,
  ADD COLUMN visa_support_needed       boolean,
  ADD COLUMN motivation                text,
  ADD COLUMN concerns                  text[]   DEFAULT '{}';

-- ── company_hiring_signals ────────────────────────────────────────────────────
CREATE TABLE public.company_hiring_signals (
  id                             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id                     text NOT NULL UNIQUE,
  company_name                   text NOT NULL,
  country                        text NOT NULL CHECK (country IN ('Japan', 'Korea', 'Other')),
  industry                       text NOT NULL,
  roles                          text[]   DEFAULT '{}',
  required_technical_skills      text[]   DEFAULT '{}',
  preferred_technical_skills     text[]   DEFAULT '{}',
  language_expectation           text[]   DEFAULT '{}',
  work_style                     text[]   DEFAULT '{}',
  company_values                 text[]   DEFAULT '{}',
  preferred_soft_skills          text[]   DEFAULT '{}',
  evaluation_signals             text[]   DEFAULT '{}',
  risk_concerns                  text[]   DEFAULT '{}',
  recommended_candidate_evidence text[]   DEFAULT '{}',
  extracted_summary              text,
  confidence_score               numeric(3,2),
  source_ids                     text[]   DEFAULT '{}',
  created_at                     timestamptz DEFAULT now() NOT NULL,
  updated_at                     timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER update_company_hiring_signals_updated_at
  BEFORE UPDATE ON public.company_hiring_signals
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

-- ── company_evaluation_rubrics ────────────────────────────────────────────────
CREATE TABLE public.company_evaluation_rubrics (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id     text NOT NULL,
  company_name   text NOT NULL,
  target_role    text NOT NULL,
  total_weight   integer NOT NULL,
  criteria       jsonb NOT NULL DEFAULT '[]'::jsonb,
  rubric_summary text,
  generated_at   timestamptz,
  created_at     timestamptz DEFAULT now() NOT NULL,
  updated_at     timestamptz DEFAULT now() NOT NULL,
  UNIQUE (company_id, target_role)
);

CREATE TRIGGER update_company_evaluation_rubrics_updated_at
  BEFORE UPDATE ON public.company_evaluation_rubrics
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

-- ── company_job_profiles ──────────────────────────────────────────────────────
CREATE TABLE public.company_job_profiles (
  id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id            text NOT NULL,
  company_name          text NOT NULL,
  role_id               text NOT NULL UNIQUE,
  role_title            text NOT NULL,
  country               text NOT NULL CHECK (country IN ('Japan', 'Korea', 'Other')),
  salary_min            bigint,
  salary_max            bigint,
  salary_currency       text NOT NULL DEFAULT 'unknown',
  locations             text[]   DEFAULT '{}',
  required_tech_stacks  text[]   DEFAULT '{}',
  preferred_tech_stacks text[]   DEFAULT '{}',
  required_languages    jsonb NOT NULL DEFAULT '[]'::jsonb,
  preferred_languages   jsonb    DEFAULT '[]'::jsonb,
  experience_min_years  integer,
  experience_max_years  integer,
  work_style            text NOT NULL DEFAULT 'unknown',
  company_type          text,
  role_category         text,
  rubric_id             text,
  source_confidence     text     CHECK (source_confidence IN ('high', 'medium', 'low', 'fallback')),
  source_urls           text[]   DEFAULT '{}',
  notes                 text,
  created_at            timestamptz DEFAULT now() NOT NULL,
  updated_at            timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER update_company_job_profiles_updated_at
  BEFORE UPDATE ON public.company_job_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

-- ── resume_context_mappings ───────────────────────────────────────────────────
CREATE TABLE public.resume_context_mappings (
  id                   text PRIMARY KEY,
  developer_profile_id bigint REFERENCES public.developer_profiles(id) ON DELETE SET NULL,
  target_locale        text NOT NULL CHECK (target_locale IN ('ko', 'ja')),
  detected_source_locale text,
  request              jsonb NOT NULL,
  response             jsonb NOT NULL,
  created_at           timestamptz DEFAULT now() NOT NULL
);

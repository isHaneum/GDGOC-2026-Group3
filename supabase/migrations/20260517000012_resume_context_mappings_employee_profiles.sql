CREATE TABLE IF NOT EXISTS public.resume_context_mappings (
  id text PRIMARY KEY,
  employee_profile_id bigint REFERENCES public.employee_profiles(id) ON DELETE SET NULL,
  target_locale text NOT NULL CHECK (target_locale IN ('ko', 'ja')),
  detected_source_locale text CHECK (detected_source_locale IN ('ko', 'ja', 'mixed', 'unknown')),
  request jsonb NOT NULL,
  response jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.resume_context_mappings ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT INSERT, SELECT ON public.resume_context_mappings TO service_role;

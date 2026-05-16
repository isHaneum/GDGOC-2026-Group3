-- Enable RLS
ALTER TABLE public.company_hiring_signals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_evaluation_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_job_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_context_mappings    ENABLE ROW LEVEL SECURITY;

-- company_* tables: public read, no user writes (admin-managed via SQL/seed)
CREATE POLICY "company_hiring_signals_select_all"
  ON public.company_hiring_signals FOR SELECT USING (true);

CREATE POLICY "company_evaluation_rubrics_select_all"
  ON public.company_evaluation_rubrics FOR SELECT USING (true);

CREATE POLICY "company_job_profiles_select_all"
  ON public.company_job_profiles FOR SELECT USING (true);

-- resume_context_mappings: developers see and write only their own rows
CREATE POLICY "resume_context_mappings_select_own"
  ON public.resume_context_mappings FOR SELECT
  USING (
    developer_profile_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.developer_profiles dp
      JOIN public.profiles p ON p.id = dp.profile_id
      WHERE dp.id = developer_profile_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "resume_context_mappings_insert_own"
  ON public.resume_context_mappings FOR INSERT
  WITH CHECK (
    developer_profile_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.developer_profiles dp
      JOIN public.profiles p ON p.id = dp.profile_id
      WHERE dp.id = developer_profile_id AND p.user_id = auth.uid()
    )
  );

-- Grants
GRANT SELECT ON public.company_hiring_signals     TO anon, authenticated;
GRANT SELECT ON public.company_evaluation_rubrics TO anon, authenticated;
GRANT SELECT ON public.company_job_profiles       TO anon, authenticated;
GRANT SELECT, INSERT ON public.resume_context_mappings TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant service_role full access to all tables so the server-side client
-- (service role key, bypasses RLS) can read and write without restriction.
GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles          TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.developer_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cvs               TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories        TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts             TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments          TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_likes        TO service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

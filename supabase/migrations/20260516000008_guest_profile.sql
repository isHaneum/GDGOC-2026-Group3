-- supabase/migrations/20260516000008_guest_profile.sql
-- Fixed guest account used by write routes when no auth session is present.
-- UUID is stable and referenced as GUEST_USER_ID constant in API routes.

INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'guest@bridge.local',
  '',
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"developer","market":"KR"}',
  false, '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (user_id, role, market)
VALUES ('00000000-0000-0000-0000-000000000001', 'developer', 'KR')
ON CONFLICT DO NOTHING;

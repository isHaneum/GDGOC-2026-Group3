import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

function read(path: string) {
  return readFileSync(join(root, path), 'utf8')
}

describe('community schema scope', () => {
  it('does not expose tags in the forum database schema or API routes', () => {
    const forumMigration = read('server/supabase/migrations/002_forum.sql')
    const rlsMigration = read('server/supabase/migrations/003_rls.sql')

    expect(forumMigration).not.toMatch(/\btags\b/)
    expect(forumMigration).not.toMatch(/\bpost_tags\b/)
    expect(rlsMigration).not.toMatch(/\btags\b/)
    expect(rlsMigration).not.toMatch(/\bpost_tags\b/)
    expect(existsSync(join(root, 'app/api/tags/route.ts'))).toBe(false)
  })

  it('grants PostgREST roles table privileges used by RLS policies', () => {
    const rlsMigration = read('server/supabase/migrations/003_rls.sql')

    expect(rlsMigration).toContain('GRANT USAGE ON SCHEMA public TO anon, authenticated;')
    expect(rlsMigration).toContain('GRANT SELECT ON public.posts TO anon, authenticated;')
    expect(rlsMigration).toContain('GRANT INSERT, UPDATE, DELETE ON public.posts TO authenticated;')
    expect(rlsMigration).toContain('GRANT INSERT, UPDATE, DELETE ON public.comments TO authenticated;')
    expect(rlsMigration).toContain('GRANT INSERT, DELETE ON public.post_likes TO authenticated;')
    expect(rlsMigration).toContain('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;')
  })

  it('backfills profiles for auth users that existed before migrations were rerun', () => {
    const authMigration = read('server/supabase/migrations/001_auth_profile.sql')

    expect(authMigration).toContain('FROM auth.users')
    expect(authMigration).toContain('ON CONFLICT (user_id) DO NOTHING')
    expect(authMigration).toContain('INSERT INTO public.developer_profiles (profile_id)')
  })

  it('defines the signup profile schema without company database tables', () => {
    const migration = read('server/supabase/migrations/009_signup_profile_schema.sql')

    expect(migration).toContain("CHECK (role IN ('employee', 'employer'))")
    expect(migration).toContain("CHECK (market IN ('KR_TO_JP', 'JP_TO_KR'))")
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS nickname text')
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.employee_profiles')
    expect(migration).toContain("gender text NOT NULL CHECK (gender IN ('male', 'female'))")
    expect(migration).toContain("nationality text NOT NULL CHECK (nationality IN ('korean', 'japanese'))")
    expect(migration).toContain("preferred_currency text NOT NULL CHECK (preferred_currency IN ('KRW', 'JPY'))")
    expect(migration).toContain("work_style_preference text NOT NULL CHECK (work_style_preference IN ('remote', 'hybrid', 'onsite', 'any'))")
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.employer_profiles')
    expect(migration).toContain('company_id text NOT NULL')
    expect(migration).toContain('DROP TABLE IF EXISTS public.company_job_profiles CASCADE')
    expect(migration).toContain('DROP TABLE IF EXISTS public.company_evaluation_rubrics CASCADE')
    expect(migration).toContain('DROP TABLE IF EXISTS public.company_hiring_signals CASCADE')
  })
})

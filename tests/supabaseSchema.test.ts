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

  it('persists salary enrichment fields for company job profiles in both migration trees', () => {
    const serverMigration = read('server/supabase/migrations/008_company_salary_enrichment.sql')
    const supabaseMigration = read('supabase/migrations/20260517000011_company_salary_enrichment.sql')

    for (const migration of [serverMigration, supabaseMigration]) {
      expect(migration).toContain('ADD COLUMN IF NOT EXISTS salary_note text')
      expect(migration).toContain('ADD COLUMN IF NOT EXISTS starting_salary_min bigint')
      expect(migration).toContain('ADD COLUMN IF NOT EXISTS average_annual_salary bigint')
      expect(migration).toContain('ADD COLUMN IF NOT EXISTS salary_source_links jsonb')
      expect(migration).toContain('UPDATE public.company_job_profiles AS profiles')
      expect(migration).toContain("('mercari'")
      expect(migration).toContain("('zozo'")
    }
  })
})

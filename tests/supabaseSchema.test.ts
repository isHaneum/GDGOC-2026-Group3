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
})

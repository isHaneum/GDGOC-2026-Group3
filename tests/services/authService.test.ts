import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signUp, signIn, signOut, getMe } from '../../server/services/authService'

function makeDb() {
  return {
    auth: {
      signUp: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1', email: 'a@test.com' } },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' }, session: { access_token: 'tok' } },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'profile-1', user_id: 'user-1', role: 'developer', market: 'KR' },
        error: null,
      }),
    }),
  }
}

describe('signUp', () => {
  it('passes email, password, and metadata to supabase', async () => {
    const db = makeDb()
    await signUp(db as any, { email: 'a@test.com', password: 'pass123', role: 'developer', market: 'KR' })
    expect(db.auth.signUp).toHaveBeenCalledWith({
      email: 'a@test.com',
      password: 'pass123',
      options: { data: { role: 'developer', market: 'KR' } },
    })
  })

  it('throws when supabase returns an error', async () => {
    const db = makeDb()
    db.auth.signUp.mockResolvedValue({ data: null, error: { message: 'Email already registered' } })
    await expect(
      signUp(db as any, { email: 'a@test.com', password: 'x', role: 'developer', market: 'KR' })
    ).rejects.toThrow('Email already registered')
  })
})

describe('signIn', () => {
  it('returns user and session on success', async () => {
    const db = makeDb()
    const result = await signIn(db as any, { email: 'a@test.com', password: 'pass123' })
    expect(result.user?.id).toBe('user-1')
    expect(result.session?.access_token).toBe('tok')
  })

  it('throws on invalid credentials', async () => {
    const db = makeDb()
    db.auth.signInWithPassword.mockResolvedValue({ data: null, error: { message: 'Invalid login credentials' } })
    await expect(
      signIn(db as any, { email: 'a@test.com', password: 'wrong' })
    ).rejects.toThrow('Invalid login credentials')
  })
})

describe('signOut', () => {
  it('calls supabase signOut', async () => {
    const db = makeDb()
    await signOut(db as any)
    expect(db.auth.signOut).toHaveBeenCalledOnce()
  })

  it('throws when supabase returns error', async () => {
    const db = makeDb()
    db.auth.signOut.mockResolvedValue({ error: { message: 'signout failed' } })
    await expect(signOut(db as any)).rejects.toThrow('signout failed')
  })
})

describe('getMe', () => {
  it('returns user and profile', async () => {
    const db = makeDb()
    const result = await getMe(db as any)
    expect(result.user.id).toBe('user-1')
    expect(result.profile.id).toBe('profile-1')
  })

  it('throws when no user is authenticated', async () => {
    const db = makeDb()
    db.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    await expect(getMe(db as any)).rejects.toThrow('Not authenticated')
  })
})

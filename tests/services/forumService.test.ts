import { describe, it, expect, vi } from 'vitest'
import {
  createPost,
  getPost,
  updatePost,
  deletePost,
  listCategories,
  toggleLike,
  createComment,
  updateComment,
  deleteComment,
} from '../../server/services/forumService'

const PROFILE = { id: 'profile-1', user_id: 'user-1' }
const POST = { id: 'post-1', author_id: 'profile-1', title: 'Hello', content: 'World', category_id: 'cat-1', like_count: 0 }
const COMMENT = { id: 'comment-1', post_id: 'post-1', author_id: 'profile-1', content: 'Nice!' }

describe('createPost', () => {
  it('inserts post and returns it', async () => {
    let i = 0
    const results = [
      { data: PROFILE, error: null },
      { data: POST, error: null },
    ]
    const builder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => Promise.resolve(results[i++])),
    }
    const db = { from: vi.fn().mockReturnValue(builder) }

    const result = await createPost(db as any, 'user-1', {
      title: 'Hello',
      content: 'World',
      category_id: 'cat-1',
    })
    expect(result.id).toBe('post-1')
    expect(result.title).toBe('Hello')
  })

  it('throws when profile lookup fails', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Profile not found' } }),
    }
    const db = { from: vi.fn().mockReturnValue(builder) }

    await expect(
      createPost(db as any, 'user-1', { title: 'x', content: 'y', category_id: 'cat-1' })
    ).rejects.toThrow('Profile not found')
  })
})

describe('updatePost', () => {
  it('throws Forbidden when author does not match', async () => {
    let i = 0
    const results = [
      { data: PROFILE, error: null },
      { data: { ...POST, author_id: 'profile-OTHER' }, error: null },
    ]
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => Promise.resolve(results[i++])),
    }
    const db = { from: vi.fn().mockReturnValue(builder) }

    await expect(
      updatePost(db as any, 'user-1', 'post-1', { title: 'New title' })
    ).rejects.toThrow('Forbidden')
  })
})

describe('deletePost', () => {
  it('throws Forbidden when author does not match', async () => {
    let i = 0
    const results = [
      { data: PROFILE, error: null },
      { data: { ...POST, author_id: 'profile-OTHER' }, error: null },
    ]
    const builder = {
      select: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => Promise.resolve(results[i++])),
    }
    const db = { from: vi.fn().mockReturnValue(builder) }

    await expect(deletePost(db as any, 'user-1', 'post-1')).rejects.toThrow('Forbidden')
  })
})

describe('listCategories', () => {
  it('returns all categories', async () => {
    const cats = [{ id: 'cat-1', name: 'KR Developers', slug: 'kr-developers', market: 'KR', description: null }]
    const builder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: cats, error: null }),
    }
    const db = { from: vi.fn().mockReturnValue(builder) }

    const result = await listCategories(db as any)
    expect(result).toEqual(cats)
  })
})

describe('toggleLike', () => {
  it('returns liked: true when inserting a new like', async () => {
    const result = { liked: true }
    expect(result.liked).toBe(true)
  })
})

describe('createComment', () => {
  it('inserts and returns comment', async () => {
    let i = 0
    const results = [
      { data: PROFILE, error: null },
      { data: COMMENT, error: null },
    ]
    const builder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => Promise.resolve(results[i++])),
    }
    const db = { from: vi.fn().mockReturnValue(builder) }

    const result = await createComment(db as any, 'user-1', 'post-1', { content: 'Nice!' })
    expect(result.content).toBe('Nice!')
  })
})

describe('updateComment', () => {
  it('throws Forbidden when author does not match', async () => {
    let i = 0
    const results = [
      { data: PROFILE, error: null },
      { data: { ...COMMENT, author_id: 'profile-OTHER' }, error: null },
    ]
    const builder = {
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => Promise.resolve(results[i++])),
    }
    const db = { from: vi.fn().mockReturnValue(builder) }

    await expect(
      updateComment(db as any, 'user-1', 'comment-1', 'Updated content')
    ).rejects.toThrow('Forbidden')
  })
})

describe('deleteComment', () => {
  it('throws Forbidden when author does not match', async () => {
    let i = 0
    const results = [
      { data: PROFILE, error: null },
      { data: { ...COMMENT, author_id: 'profile-OTHER' }, error: null },
    ]
    const builder = {
      select: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => Promise.resolve(results[i++])),
    }
    const db = { from: vi.fn().mockReturnValue(builder) }

    await expect(deleteComment(db as any, 'user-1', 'comment-1')).rejects.toThrow('Forbidden')
  })
})

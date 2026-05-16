import type { SupabaseClient } from '@supabase/supabase-js'

export type CreatePostInput = {
  title: string
  content: string
  category_id: string
  image_url?: string
}

export type UpdatePostInput = Partial<Pick<CreatePostInput, 'title' | 'content' | 'category_id'>>

export async function listPosts(
  db: SupabaseClient,
  params: { category?: string; q?: string; limit?: number; offset?: number }
) {
  const limit = params.limit ?? 20
  const offset = params.offset ?? 0

  let query = db
    .from('posts')
    .select(`
      *,
      author:profiles!author_id(id, role, market),
      category:categories!category_id(*),
      comment_count:comments(count)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1)

  if (params.category) {
    const { data: cat } = await db
      .from('categories')
      .select('id')
      .eq('slug', params.category)
      .single()
    if (cat) query = query.eq('category_id', cat.id)
  }

  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,content.ilike.%${params.q}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export async function getPost(db: SupabaseClient, postId: string) {
  const { data, error } = await db
    .from('posts')
    .select(`
      *,
      author:profiles!author_id(id, role, market, developer_profiles(full_name)),
      category:categories!category_id(*),
      comments(*, author:profiles!author_id(id, role, market, developer_profiles(full_name)))
    `)
    .eq('id', postId)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createPost(
  db: SupabaseClient,
  userId: string,
  input: CreatePostInput
) {
  const { data: profile, error: e1 } = await db
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single()
  if (e1) throw new Error(e1.message)

  const { data: post, error } = await db
    .from('posts')
    .insert({ author_id: profile.id, category_id: input.category_id, title: input.title, content: input.content, image_url: input.image_url ?? null })
    .select()
    .single()
  if (error) throw new Error(error.message)

  return post
}

export async function updatePost(
  db: SupabaseClient,
  userId: string,
  postId: string,
  input: UpdatePostInput
) {
  const { data: profile } = await db.from('profiles').select('id').eq('user_id', userId).single()
  const { data: post } = await db.from('posts').select('author_id').eq('id', postId).single()

  if (!profile || !post || post.author_id !== profile.id) throw new Error('Forbidden')

  const { data, error } = await db.from('posts').update(input).eq('id', postId).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deletePost(db: SupabaseClient, userId: string, postId: string) {
  const { data: profile } = await db.from('profiles').select('id').eq('user_id', userId).single()
  const { data: post } = await db.from('posts').select('author_id').eq('id', postId).single()

  if (!profile || !post || post.author_id !== profile.id) throw new Error('Forbidden')

  const { error } = await db.from('posts').delete().eq('id', postId)
  if (error) throw new Error(error.message)
}

export async function listCategories(db: SupabaseClient) {
  const { data, error } = await db.from('categories').select('*').order('name')
  if (error) throw new Error(error.message)
  return data
}

export async function toggleLike(db: SupabaseClient, userId: string, postId: string) {
  const { data: existing } = await db
    .from('post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    const { error } = await db.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
    if (error) throw new Error(error.message)
    return { liked: false }
  }

  const { error } = await db.from('post_likes').insert({ post_id: postId, user_id: userId })
  if (error) throw new Error(error.message)
  return { liked: true }
}

export async function createComment(
  db: SupabaseClient,
  userId: string,
  postId: string,
  input: { content: string }
) {
  const { data: profile, error: e1 } = await db
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .single()
  if (e1) throw new Error(e1.message)

  const { data, error } = await db
    .from('comments')
    .insert({ post_id: postId, author_id: profile.id, content: input.content })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateComment(
  db: SupabaseClient,
  userId: string,
  commentId: string,
  content: string
) {
  const { data: profile } = await db.from('profiles').select('id').eq('user_id', userId).single()
  const { data: comment } = await db.from('comments').select('author_id').eq('id', commentId).single()

  if (!profile || !comment || comment.author_id !== profile.id) throw new Error('Forbidden')

  const { data, error } = await db
    .from('comments')
    .update({ content })
    .eq('id', commentId)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteComment(db: SupabaseClient, userId: string, commentId: string) {
  const { data: profile } = await db.from('profiles').select('id').eq('user_id', userId).single()
  const { data: comment } = await db.from('comments').select('author_id').eq('id', commentId).single()

  if (!profile || !comment || comment.author_id !== profile.id) throw new Error('Forbidden')

  const { error } = await db.from('comments').delete().eq('id', commentId)
  if (error) throw new Error(error.message)
}

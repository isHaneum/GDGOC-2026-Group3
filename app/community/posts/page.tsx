'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getCategories, getPosts, createPost, uploadImage } from '@src/api/client'
import type { DbCategory, PostWithMeta } from '@shared/types'

export default function CommunityPage() {
  const [categories, setCategories] = useState<DbCategory[]>([])
  const [posts, setPosts] = useState<PostWithMeta[]>([])
  const [popularPosts, setPopularPosts] = useState<PostWithMeta[]>([])
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Write form state
  const [showForm, setShowForm] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formCategoryId, setFormCategoryId] = useState<number | null>(null)
  const [formImageFile, setFormImageFile] = useState<File | null>(null)
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getCategories()
      .then((res) => {
        setCategories(res.categories)
        if (res.categories.length > 0) setFormCategoryId(res.categories[0].id)
      })
      .catch(() => {})
    // 인기글: 전체 카테고리 기준, like_count 상위 5개
    getPosts()
      .then((res) => {
        const sorted = [...res.posts].sort((a, b) => b.like_count - a.like_count).slice(0, 5)
        setPopularPosts(sorted)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    getPosts(activeSlug || search ? { category: activeSlug ?? undefined, q: search || undefined } : undefined)
      .then((res) => setPosts(res.posts))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load posts'))
      .finally(() => setLoading(false))
  }, [activeSlug, search])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setFormImageFile(file)
    if (file) {
      setFormImagePreview(URL.createObjectURL(file))
    } else {
      setFormImagePreview(null)
    }
  }

  function clearImage() {
    setFormImageFile(null)
    setFormImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle.trim() || !formContent.trim() || !formCategoryId) return
    setSubmitting(true)
    try {
      let image_url: string | undefined
      if (formImageFile) {
        image_url = await uploadImage(formImageFile)
      }
      await createPost(formTitle.trim(), formContent.trim(), formCategoryId, image_url)
      setShowForm(false)
      setFormTitle('')
      setFormContent('')
      clearImage()
      const res = await getPosts(activeSlug || search ? { category: activeSlug ?? undefined, q: search || undefined } : undefined)
      setPosts(res.posts)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create post')
    } finally {
      setSubmitting(false)
    }
  }

  function getCommentCount(post: PostWithMeta): number {
    const raw = post.comment_count as unknown
    if (typeof raw === 'number') return raw
    if (Array.isArray(raw) && raw.length > 0) return (raw[0] as { count: number }).count
    return 0
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const h = Math.floor(diff / 3600000)
    if (h < 1) return '방금 전'
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  const categoryBadgeColor = (slug: string) => {
    if (slug === 'nuance') return 'bg-bridge-primary/10 text-bridge-teal'
    if (slug === 'career') return 'bg-bridge-coral/10 text-bridge-coral'
    if (slug === 'growth') return 'bg-bridge-blue/10 text-bridge-blue'
    return 'bg-gray-100 text-gray-500'
  }

  function categoryFlag(slug: string) {
    if (slug === 'kr') return '🇰🇷'
    if (slug === 'jp') return '🇯🇵'
    return 'ALL'
  }

  return (
    <div className="min-h-screen bg-bridge-paper">
      <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex gap-5">
      {/* Main content */}
      <div className="flex-1 min-w-0">

        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-micro font-black uppercase tracking-widest text-bridge-teal mb-1">문화 포럼</p>
            <h1 className="text-h1 font-bold text-ink">커뮤니티</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-ink text-white px-4 py-2 rounded-xl text-body font-bold hover:bg-black transition-colors"
          >
            + 글쓰기
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="게시글 검색"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-body focus:outline-none focus:ring-2 focus:ring-bridge-primary pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink text-caption font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveSlug(activeSlug === cat.slug ? null : cat.slug)}
              className={`rounded-full px-4 py-1.5 text-micro font-black uppercase tracking-widest transition-colors ${
                activeSlug === cat.slug ? 'bg-ink text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-ink'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Post list */}
        {loading ? (
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl bg-bridge-coral/10 border border-bridge-coral/30 p-4 text-body text-bridge-coral font-bold">
            {error}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl bg-white border border-gray-100 p-10 text-center text-gray-400 text-body">
            {search ? `"${search}" 검색 결과가 없습니다.` : '아직 게시글이 없습니다.'}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-100">
            {posts.map((post, i) => (
              <Link
                key={post.id}
                href={`/community/posts/${post.id}`}
                className={`flex items-center gap-4 bg-white px-5 py-4 hover:bg-gray-50 transition-colors group ${
                  i !== 0 ? 'border-t border-gray-100' : ''
                }`}
              >
                {/* Like count */}
                <div className="text-center min-w-[36px]">
                  <div className="font-black text-body text-bridge-teal">{post.like_count}</div>
                  <div className="text-micro text-gray-400 font-bold uppercase">좋아요</div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-micro font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${categoryBadgeColor(post.category?.slug ?? '')}`}>
                      {post.category?.name ?? '—'}
                    </span>
                  </div>
                  <div className="font-bold text-body text-ink group-hover:text-bridge-teal transition-colors truncate">
                    {post.title}
                  </div>
                  <div className="text-micro text-gray-400 mt-0.5 truncate">
                    {post.content.slice(0, 80)}{post.content.length > 80 ? '…' : ''}
                  </div>
                  <div className="text-micro text-gray-300 mt-0.5">
                    {timeAgo(post.created_at)} · 댓글 {getCommentCount(post)}개
                  </div>
                </div>

                {/* Thumbnail */}
                {post.image_url && (
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                    <Image src={post.image_url} alt="" fill className="object-cover" />
                  </div>
                )}

                <span className="text-gray-300 group-hover:text-bridge-primary transition-colors">›</span>
              </Link>
            ))}
          </div>
        )}

        {/* Write modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-xl shadow-panel border border-gray-100 p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-5">
                <h2 className="font-black text-h2 text-ink">새 글 작성</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-ink text-body font-bold">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-micro font-black uppercase tracking-widest text-gray-400 block mb-1.5">카테고리</label>
                  <select
                    value={formCategoryId ?? ''}
                    onChange={(e) => setFormCategoryId(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-bridge-primary"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-micro font-black uppercase tracking-widest text-gray-400 block mb-1.5">제목</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="제목을 입력하세요"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-bridge-primary"
                    required
                  />
                </div>
                <div>
                  <label className="text-micro font-black uppercase tracking-widest text-gray-400 block mb-1.5">내용</label>
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    rows={4}
                    placeholder="내용을 입력하세요"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-bridge-primary resize-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-micro font-black uppercase tracking-widest text-gray-400 block mb-1.5">이미지 (선택)</label>
                  {formImagePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200">
                      <Image src={formImagePreview} alt="preview" width={480} height={200} className="w-full object-cover max-h-48" />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 text-caption flex items-center justify-center hover:bg-black/70"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-dashed border-gray-200 py-6 text-body text-gray-400 cursor-pointer hover:border-bridge-primary hover:text-bridge-teal transition-colors">
                      <span>📷 이미지 첨부</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-1">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-body font-bold text-gray-500 hover:text-ink">취소</button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-ink text-white px-5 py-2 rounded-xl text-body font-bold hover:bg-black disabled:opacity-50"
                  >
                    {submitting ? '올리는 중...' : '게시'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>{/* end main content */}

      {/* Popular posts sidebar */}
      <aside className="hidden lg:block w-72 flex-shrink-0 ml-4">
        <div className="sticky top-24 bg-white rounded-xl border border-gray-100 shadow-panel p-5">
          <p className="text-micro font-black uppercase tracking-widest text-bridge-teal mb-5">🔥 인기글</p>
          {popularPosts.length === 0 ? (
            <p className="text-body text-gray-400">아직 게시글이 없습니다.</p>
          ) : (
            <ol className="space-y-4">
              {popularPosts.map((post, i) => (
                <li key={post.id}>
                  <Link
                    href={`/community/posts/${post.id}`}
                    className="flex items-start gap-3 group"
                  >
                    <span className="text-body font-black text-gray-200 mt-0.5 min-w-[18px]">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-body">
                          {categoryFlag(post.category?.slug ?? '')}
                        </span>
                        <span className="text-micro font-bold text-bridge-teal">
                          ♥ {post.like_count}
                        </span>
                      </div>
                      <p className="text-body font-bold text-ink group-hover:text-bridge-teal transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </aside>

      </div>{/* end flex */}
      </div>{/* end container */}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { getPost, addComment, togglePostLike } from '@src/api/client'
import type { PostWithComments } from '@shared/types'

type Comment = PostWithComments['comments'][number]

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const [post, setPost] = useState<PostWithComments | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [liking, setLiking] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])

  useEffect(() => {
    setLoading(true)
    getPost(postId)
      .then((data) => {
        setPost(data)
        setLikeCount(data.like_count)
        setComments(data.comments ?? [])
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load post'))
      .finally(() => setLoading(false))
  }, [postId])

  async function handleLike() {
    if (liking) return
    setLiking(true)
    try {
      const res = await togglePostLike(postId)
      setLiked(res.liked)
      setLikeCount((prev) => prev + (res.liked ? 1 : -1))
    } catch {
      // silent fail
    } finally {
      setLiking(false)
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return
    setSubmittingComment(true)
    try {
      const newComment = await addComment(postId, commentText.trim())
      setComments((prev) => [
        ...prev,
        { ...newComment, post_id: Number(postId), author_id: 0, updated_at: newComment.created_at, author: { id: 0, role: 'developer', market: 'KR', developer_profiles: [] } }
      ])
      setCommentText('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to post comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const h = Math.floor(diff / 3600000)
    if (h < 1) return '방금 전'
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  function getAuthorName(author: PostWithComments['author'] | PostWithComments['comments'][number]['author']): string {
    return author.developer_profiles?.[0]?.full_name ?? 'Guest'
  }

  const categoryBadgeColor = (slug: string) => {
    if (slug === 'nuance') return 'bg-bridge-primary/10 text-bridge-teal'
    if (slug === 'career') return 'bg-bridge-coral/10 text-bridge-coral'
    if (slug === 'growth') return 'bg-bridge-blue/10 text-bridge-blue'
    return 'bg-gray-100 text-gray-500'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bridge-paper">
        <div className="container mx-auto max-w-2xl px-4 py-8 space-y-4">
          <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="bg-white rounded-xl border border-gray-100 shadow-panel p-5 space-y-3 animate-pulse">
            <div className="h-4 w-1/3 bg-gray-200 rounded" />
            <div className="h-6 w-2/3 bg-gray-200 rounded" />
            <div className="h-20 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-bridge-paper flex items-center justify-center">
        <div className="text-center">
          <p className="text-bridge-coral font-bold mb-4">{error ?? '포스트를 찾을 수 없습니다.'}</p>
          <Link href="/community/posts" className="text-sm text-bridge-primary font-bold hover:underline">← 커뮤니티로</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bridge-paper">
      <div className="container mx-auto max-w-2xl px-4 py-8 space-y-5">

        <Link href="/community/posts" className="text-sm font-bold text-gray-400 hover:text-bridge-primary transition-colors">
          ← 커뮤니티로
        </Link>

        {/* Post card */}
        <article className="bg-white rounded-xl border border-gray-100 shadow-panel p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${categoryBadgeColor(post.category?.slug ?? '')}`}>
              {post.category?.name ?? '—'}
            </span>
            <span className="text-[10px] text-gray-400">{getAuthorName(post.author)}</span>
            <span className="text-[10px] text-gray-300">·</span>
            <span className="text-[10px] text-gray-400">{timeAgo(post.created_at)}</span>
          </div>
          <h1 className="text-2xl font-bold text-ink mb-4">{post.title}</h1>
          {post.image_url && (
            <div className="relative w-full rounded-xl overflow-hidden mb-4 border border-gray-100">
              <Image src={post.image_url} alt="" width={640} height={360} className="w-full object-cover max-h-80" />
            </div>
          )}
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>

          {/* Like button */}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleLike}
              disabled={liking}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                liked
                  ? 'bg-bridge-primary/10 border-bridge-primary text-bridge-teal'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-bridge-primary hover:text-bridge-teal'
              }`}
            >
              <span>{liked ? '♥' : '♡'}</span>
              <span>{likeCount}</span>
            </button>
          </div>
        </article>

        {/* Comments */}
        <section>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
            댓글 {comments.length}개
          </p>

          {comments.length > 0 && (
            <div className="space-y-3 mb-6">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
                  <p className="text-[10px] font-bold text-bridge-teal mb-1">{getAuthorName(comment.author)}</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                  <p className="text-[10px] text-gray-400 mt-1.5">{timeAgo(comment.created_at)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Comment form */}
          <form onSubmit={handleComment} className="bg-white rounded-xl border border-gray-100 shadow-panel p-4 space-y-3">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              placeholder="댓글을 작성하세요..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bridge-primary resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="bg-ink text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-black disabled:opacity-50"
              >
                {submittingComment ? '올리는 중...' : '댓글 작성'}
              </button>
            </div>
          </form>
        </section>

      </div>
    </div>
  )
}

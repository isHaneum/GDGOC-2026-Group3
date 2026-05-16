import type { DbCategory, DbComment, DbPost } from '@shared/types'

export type CommunityLocale = 'ko' | 'ja'

export const COMMUNITY_LOCALE_STORAGE_KEY = 'bridgepass_community_locale'

export const communityCopy = {
  ko: {
    eyebrow: '문화 포럼',
    heading: '커뮤니티',
    writePost: '+ 글쓰기',
    searchPlaceholder: '게시글 검색',
    likes: '좋아요',
    comments: '댓글',
    commentUnit: '개',
    noPosts: '아직 게시글이 없습니다.',
    noSearchResults: (search: string) => `"${search}" 검색 결과가 없습니다.`,
    newPost: '새 글 작성',
    category: '카테고리',
    title: '제목',
    titlePlaceholder: '제목을 입력하세요',
    content: '내용',
    contentPlaceholder: '내용을 입력하세요',
    imageOptional: '이미지 (선택)',
    attachImage: '이미지 첨부',
    cancel: '취소',
    submittingPost: '올리는 중...',
    submitPost: '게시',
    popularPosts: '🔥 인기글',
    backToCommunity: '← 커뮤니티로',
    postNotFound: '포스트를 찾을 수 없습니다.',
    commentPlaceholder: '댓글을 작성하세요...',
    submittingComment: '올리는 중...',
    submitComment: '댓글 작성',
    justNow: '방금 전',
    hoursAgo: (hours: number) => `${hours}시간 전`,
    daysAgo: (days: number) => `${days}일 전`,
  },
  ja: {
    eyebrow: 'カルチャーフォーラム',
    heading: 'コミュニティ',
    writePost: '+ 投稿する',
    searchPlaceholder: '投稿を検索',
    likes: 'いいね',
    comments: 'コメント',
    commentUnit: '件',
    noPosts: 'まだ投稿がありません。',
    noSearchResults: (search: string) => `"${search}" の検索結果がありません。`,
    newPost: '新規投稿',
    category: 'カテゴリー',
    title: 'タイトル',
    titlePlaceholder: 'タイトルを入力してください',
    content: '内容',
    contentPlaceholder: '内容を入力してください',
    imageOptional: '画像（任意）',
    attachImage: '画像を添付',
    cancel: 'キャンセル',
    submittingPost: '投稿中...',
    submitPost: '投稿',
    popularPosts: '🔥 人気投稿',
    backToCommunity: '← コミュニティへ',
    postNotFound: '投稿が見つかりません。',
    commentPlaceholder: 'コメントを入力してください...',
    submittingComment: '投稿中...',
    submitComment: 'コメントを投稿',
    justNow: 'たった今',
    hoursAgo: (hours: number) => `${hours}時間前`,
    daysAgo: (days: number) => `${days}日前`,
  },
} satisfies Record<CommunityLocale, Record<string, unknown>>

function isCommunityLocale(value: string | null): value is CommunityLocale {
  return value === 'ko' || value === 'ja'
}

function clean(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed || null
}

export function readStoredCommunityLocale(): CommunityLocale {
  if (typeof window === 'undefined') return 'ko'

  try {
    const stored = window.localStorage.getItem(COMMUNITY_LOCALE_STORAGE_KEY)
    return isCommunityLocale(stored) ? stored : 'ko'
  } catch {
    return 'ko'
  }
}

export function writeStoredCommunityLocale(locale: CommunityLocale) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(COMMUNITY_LOCALE_STORAGE_KEY, locale)
  } catch {
    // Ignore unavailable storage. The in-memory React state still updates.
  }
}

export function getLocalizedPostTitle(post: Pick<DbPost, 'title' | 'title_ko' | 'title_ja'>, locale: CommunityLocale) {
  return clean(locale === 'ja' ? post.title_ja : post.title_ko) ?? post.title
}

export function getLocalizedPostContent(
  post: Pick<DbPost, 'content' | 'content_ko' | 'content_ja'>,
  locale: CommunityLocale
) {
  return clean(locale === 'ja' ? post.content_ja : post.content_ko) ?? post.content
}

export function getLocalizedCommentContent(
  comment: Pick<DbComment, 'content' | 'content_ko' | 'content_ja'>,
  locale: CommunityLocale
) {
  return clean(locale === 'ja' ? comment.content_ja : comment.content_ko) ?? comment.content
}

export function getLocalizedCategoryName(category: DbCategory | null | undefined, locale: CommunityLocale) {
  if (!category) return '—'

  const slug = category.slug.toLowerCase()
  if (slug === 'all') return locale === 'ja' ? 'すべて' : '전체'
  if (slug === 'kr') return locale === 'ja' ? '韓国' : '한국'
  if (slug === 'jp') return locale === 'ja' ? '日本' : '일본'

  return category.name
}

export function formatCommunityTimeAgo(dateStr: string, locale: CommunityLocale) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  const copy = communityCopy[locale]

  if (hours < 1) return copy.justNow
  if (hours < 24) return copy.hoursAgo(hours)
  return copy.daysAgo(Math.floor(hours / 24))
}

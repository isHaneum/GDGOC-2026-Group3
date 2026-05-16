import { describe, expect, it } from 'vitest'

import {
  formatCommunityTimeAgo,
  getLocalizedCategoryName,
  getLocalizedCommentContent,
  getLocalizedPostContent,
  getLocalizedPostTitle,
} from '../src/lib/communityTranslations'

describe('community translation helpers', () => {
  it('uses translated post fields for the selected locale', () => {
    const post = {
      title: '원문 제목',
      title_ko: '한국어 제목',
      title_ja: '日本語タイトル',
      content: '원문 내용',
      content_ko: '한국어 내용',
      content_ja: '日本語本文',
    }

    expect(getLocalizedPostTitle(post, 'ko')).toBe('한국어 제목')
    expect(getLocalizedPostTitle(post, 'ja')).toBe('日本語タイトル')
    expect(getLocalizedPostContent(post, 'ko')).toBe('한국어 내용')
    expect(getLocalizedPostContent(post, 'ja')).toBe('日本語本文')
  })

  it('falls back to original post and comment text when translation fields are empty', () => {
    const post = {
      title: 'Original title',
      title_ko: '',
      title_ja: null,
      content: 'Original content',
      content_ko: undefined,
      content_ja: '   ',
    }
    const comment = {
      content: 'Original comment',
      content_ko: '',
      content_ja: null,
    }

    expect(getLocalizedPostTitle(post, 'ko')).toBe('Original title')
    expect(getLocalizedPostTitle(post, 'ja')).toBe('Original title')
    expect(getLocalizedPostContent(post, 'ja')).toBe('Original content')
    expect(getLocalizedCommentContent(comment, 'ja')).toBe('Original comment')
  })

  it('localizes core category labels and relative time copy', () => {
    expect(getLocalizedCategoryName({ id: 1, name: 'All', slug: 'all', market: 'ALL', description: null }, 'ko')).toBe('전체')
    expect(getLocalizedCategoryName({ id: 2, name: 'KR', slug: 'kr', market: 'KR', description: null }, 'ja')).toBe('韓国')
    expect(formatCommunityTimeAgo(new Date().toISOString(), 'ja')).toBe('たった今')
  })
})

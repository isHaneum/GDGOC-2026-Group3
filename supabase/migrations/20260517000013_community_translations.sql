-- Adds Korean/Japanese translated display fields for community posts and comments.
-- Original title/content columns remain the source of truth for user-entered text.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS title_ko text,
  ADD COLUMN IF NOT EXISTS title_ja text,
  ADD COLUMN IF NOT EXISTS content_ko text,
  ADD COLUMN IF NOT EXISTS content_ja text;

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS content_ko text,
  ADD COLUMN IF NOT EXISTS content_ja text;

CREATE INDEX IF NOT EXISTS posts_title_ko_search_idx
  ON public.posts USING gin (title_ko gin_trgm_ops);

CREATE INDEX IF NOT EXISTS posts_title_ja_search_idx
  ON public.posts USING gin (title_ja gin_trgm_ops);

CREATE INDEX IF NOT EXISTS posts_content_ko_search_idx
  ON public.posts USING gin (content_ko gin_trgm_ops);

CREATE INDEX IF NOT EXISTS posts_content_ja_search_idx
  ON public.posts USING gin (content_ja gin_trgm_ops);

NOTIFY pgrst, 'reload schema';

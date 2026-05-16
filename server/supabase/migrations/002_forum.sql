-- pg_trgm for multilingual (KR/JP) ILIKE search with GIN index
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- categories: seeded at deploy time, not user-created
CREATE TABLE public.categories (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  market      text NOT NULL CHECK (market IN ('KR', 'JP', 'ALL')),
  description text
);

-- tags: user-created during post authoring
CREATE TABLE public.tags (
  id   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE
);

-- posts
CREATE TABLE public.posts (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  author_id   bigint REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id bigint REFERENCES public.categories(id) NOT NULL,
  title       text NOT NULL,
  content     text NOT NULL,
  like_count  int DEFAULT 0 NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

-- GIN trgm indexes for ILIKE search on Korean/Japanese/English content
CREATE INDEX posts_title_search_idx   ON public.posts USING GIN (title gin_trgm_ops);
CREATE INDEX posts_content_search_idx ON public.posts USING GIN (content gin_trgm_ops);
CREATE INDEX posts_category_idx       ON public.posts (category_id);
CREATE INDEX posts_author_idx         ON public.posts (author_id);
CREATE INDEX posts_created_idx        ON public.posts (created_at DESC);

-- post_tags: many-to-many join
CREATE TABLE public.post_tags (
  post_id bigint REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  tag_id  bigint REFERENCES public.tags(id)  ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (post_id, tag_id)
);

-- comments
CREATE TABLE public.comments (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  post_id    bigint REFERENCES public.posts(id)    ON DELETE CASCADE NOT NULL,
  author_id  bigint REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content    text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX comments_post_idx ON public.comments (post_id);

-- post_likes: composite PK prevents duplicate likes
-- user_id stays uuid because it references auth.users(id)
CREATE TABLE public.post_likes (
  post_id    bigint REFERENCES public.posts(id)    ON DELETE CASCADE NOT NULL,
  user_id    uuid   REFERENCES auth.users(id)      ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

-- keep posts.like_count in sync
CREATE OR REPLACE FUNCTION public.sync_post_like_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_post_like_change
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE PROCEDURE public.sync_post_like_count();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

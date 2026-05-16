-- Enable RLS on all tables
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes        ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select_all"  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- developer_profiles
CREATE POLICY "dev_profiles_select_all" ON public.developer_profiles FOR SELECT USING (true);
CREATE POLICY "dev_profiles_insert_own" ON public.developer_profiles FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid()
  ));
CREATE POLICY "dev_profiles_update_own" ON public.developer_profiles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = profile_id AND user_id = auth.uid()
  ));

-- cvs (ownership chain: cvs → developer_profiles → profiles → auth.users)
CREATE POLICY "cvs_select_all"  ON public.cvs FOR SELECT USING (true);
CREATE POLICY "cvs_insert_own"  ON public.cvs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.developer_profiles dp
    JOIN public.profiles p ON p.id = dp.profile_id
    WHERE dp.id = developer_profile_id AND p.user_id = auth.uid()
  ));
CREATE POLICY "cvs_update_own"  ON public.cvs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.developer_profiles dp
    JOIN public.profiles p ON p.id = dp.profile_id
    WHERE dp.id = developer_profile_id AND p.user_id = auth.uid()
  ));
CREATE POLICY "cvs_delete_own"  ON public.cvs FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.developer_profiles dp
    JOIN public.profiles p ON p.id = dp.profile_id
    WHERE dp.id = developer_profile_id AND p.user_id = auth.uid()
  ));

-- categories: read-only for users (managed by admin via SQL)
CREATE POLICY "categories_select_all" ON public.categories FOR SELECT USING (true);

-- tags
CREATE POLICY "tags_select_all"    ON public.tags FOR SELECT USING (true);
CREATE POLICY "tags_insert_auth"   ON public.tags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- post_tags
CREATE POLICY "post_tags_select_all"  ON public.post_tags FOR SELECT USING (true);
CREATE POLICY "post_tags_insert_own"  ON public.post_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.posts ps
    JOIN public.profiles p ON p.id = ps.author_id
    WHERE ps.id = post_id AND p.user_id = auth.uid()
  ));
CREATE POLICY "post_tags_delete_own"  ON public.post_tags FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.posts ps
    JOIN public.profiles p ON p.id = ps.author_id
    WHERE ps.id = post_id AND p.user_id = auth.uid()
  ));

-- posts
CREATE POLICY "posts_select_all"   ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts_insert_own"   ON public.posts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = author_id AND user_id = auth.uid()
  ));
CREATE POLICY "posts_update_own"   ON public.posts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = author_id AND user_id = auth.uid()
  ));
CREATE POLICY "posts_delete_own"   ON public.posts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = author_id AND user_id = auth.uid()
  ));

-- comments
CREATE POLICY "comments_select_all"  ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_own"  ON public.comments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = author_id AND user_id = auth.uid()
  ));
CREATE POLICY "comments_update_own"  ON public.comments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = author_id AND user_id = auth.uid()
  ));
CREATE POLICY "comments_delete_own"  ON public.comments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = author_id AND user_id = auth.uid()
  ));

-- post_likes
CREATE POLICY "post_likes_select_all"  ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "post_likes_insert_own"  ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_likes_delete_own"  ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

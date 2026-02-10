-- Supabase Storage RLS Policies for BarterDash

-- 1. Create buckets if they don't exist (Run this in the SQL editor)
-- insert into storage.buckets (id, name, public) values ('thumbnails', 'thumbnails', true);
-- insert into storage.buckets (id, name, public) values ('images', 'images', true);

-- 2. Enable Read Access for everyone
CREATE POLICY "Give public access to thumbnails 1hfz_0" ON storage.objects FOR SELECT TO public USING (bucket_id = 'thumbnails');
CREATE POLICY "Give public access to images 1hfz_0" ON storage.objects FOR SELECT TO public USING (bucket_id = 'images');

-- 3. Enable Insert Access for authenticated users
CREATE POLICY "Allow authenticated uploads to thumbnails 1hfz_0" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'thumbnails');
CREATE POLICY "Allow authenticated uploads to images 1hfz_0" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images');

-- 4. Enable Update/Delete for owners
CREATE POLICY "Allow owners to update their thumbnails 1hfz_0" ON storage.objects FOR UPDATE TO authenticated USING (auth.uid() = owner) WITH CHECK (bucket_id = 'thumbnails');
CREATE POLICY "Allow owners to update their images 1hfz_0" ON storage.objects FOR UPDATE TO authenticated USING (auth.uid() = owner) WITH CHECK (bucket_id = 'images');
CREATE POLICY "Allow owners to delete their thumbnails 1hfz_0" ON storage.objects FOR DELETE TO authenticated USING (auth.uid() = owner);
CREATE POLICY "Allow owners to delete their images 1hfz_0" ON storage.objects FOR DELETE TO authenticated USING (auth.uid() = owner);

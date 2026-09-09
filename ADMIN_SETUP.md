# Gill Shooting Academy Admin Panel

The secure admin panel is at `admin.html`. It can manage academy information, programs, coaches, facilities, news, testimonials, achievements, gallery images, and admission/contact enquiries.

## One-time Supabase setup

1. In **Supabase Dashboard → SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql), then run [`supabase/admin.sql`](supabase/admin.sql).
2. In **Authentication → Users → Add user**, create `techaadi007@gmail.com` with the password you selected. Confirm the user if Supabase asks. Then run the final `insert into public.admin_users ...` statement at the bottom of `supabase/admin.sql` once more.
3. Open `admin.html`. The panel now shows a one-time connection form: paste the Project URL and publishable key from **Supabase → Connect**. Never use or publish the `service_role`/secret key. The safe publishable configuration stays only in that browser's local storage.

`admin-config.js` is optional and ignored by Git so configuration stays private. Open `admin.html` through your deployed site—not only as a local file—to sign in and manage the site.

## Security

- Only the email listed in `admin_users` can access the dashboard.
- Images upload into the `academy-media` Supabase Storage bucket, with public read-only access and admin-only write/delete access.
- Website visitors can submit enquiries but cannot read them.

# Gill Shooting Academy Admin Panel

The secure admin panel is at `admin.html`. It can manage academy information, programs, coaches, facilities, news, testimonials, achievements, gallery images, and admission/contact enquiries.

## One-time Supabase setup

1. In **Supabase Dashboard → SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql), then run [`supabase/admin.sql`](supabase/admin.sql).
2. In **Authentication → Users → Add user**, create `techaadi007@gmail.com` with the password you selected. Confirm the user if Supabase asks. Then run the final `insert into public.admin_users ...` statement at the bottom of `supabase/admin.sql` once more.
3. The admin panel is already configured for the current Supabase project. Open `admin.html` and sign in. Never use or publish the `service_role`/secret key.

`admin-config.js` contains only the browser-safe project URL and publishable key. Open `admin.html` through your deployed site—not only as a local file—to sign in and manage the site.

## Security

- Only the email listed in `admin_users` can access the dashboard.
- Images upload into the `academy-media` Supabase Storage bucket, with public read-only access and admin-only write/delete access.
- Website visitors can submit enquiries but cannot read them.

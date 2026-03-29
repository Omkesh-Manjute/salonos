# SalonOS backend setup

## 1. Supabase
- Create a new Supabase project.
- In the SQL editor, run `supabase/schema.sql`.
- Enable phone auth for customers.
- Enable email/password auth for owners and admins.
- Add a seed admin user in `auth.users`, then update `public.users.role = 'admin'`.
- Copy the project URL and anon key into `.env` using `.env.example`.

## 2. Firebase Cloud Messaging
- Create a Firebase project and enable Cloud Messaging.
- Add a web app and copy the config keys into `.env`.
- Generate a Web Push certificate key pair and set `VITE_FIREBASE_VAPID_KEY`.
- Add the service worker from `public/firebase-messaging-sw.js`.
- In Supabase, create an Edge Function or server worker that watches `public.notifications` and dispatches FCM pushes to each stored `fcm_token`.

## 3. Realtime
- In Supabase, enable realtime for `bookings`, `queue`, and `notifications`.
- The app subscribes to `queue` and `bookings` for live owner/customer updates.

## 4. Multi-tenant flow
- Each salon row owns a unique `tenant_id`.
- Every data table includes `tenant_id` and RLS filters by `current_tenant_id()`.
- Admin can access all rows; owners and customers are scoped automatically.

## 5. Production notes
- Keep the anon key client-side only; use service role keys only in server code.
- Move FCM send logic into a trusted server or Edge Function.
- Add rate limits for OTP and email auth.
- Seed services per salon after onboarding.
- Turn on log drains, audit logs, and backup retention in Supabase.

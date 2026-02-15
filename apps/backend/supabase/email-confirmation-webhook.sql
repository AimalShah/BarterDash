-- Creates a webhook trigger that calls the backend only when
-- auth.users.email_confirmed_at transitions from NULL -> non-NULL.
-- Run this in Supabase SQL Editor (as postgres role).
--
-- Replace these placeholders before running:
--   YOUR_API_BASE_URL
--   YOUR_SUPABASE_WEBHOOK_SECRET

drop trigger if exists auth_users_email_confirmation_webhook on auth.users;

create trigger auth_users_email_confirmation_webhook
after update on auth.users
for each row
when (
  coalesce(to_jsonb(old)->>'email_confirmed_at', to_jsonb(old)->>'confirmed_at') is null
  and coalesce(to_jsonb(new)->>'email_confirmed_at', to_jsonb(new)->>'confirmed_at') is not null
)
execute function supabase_functions.http_request(
  'https://YOUR_API_BASE_URL/api/v1/webhooks/supabase/email-confirmation',
  'POST',
  '{"Content-Type":"application/json","x-webhook-secret":"YOUR_SUPABASE_WEBHOOK_SECRET"}',
  '{}',
  '1000'
);

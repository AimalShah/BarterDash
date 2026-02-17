-- ============================================
-- EMAIL VERIFICATION WEBHOOK SETUP
-- Run this in Supabase SQL Editor
-- ============================================

-- This creates a webhook trigger that calls your backend
-- whenever a user's email is confirmed

drop trigger if exists auth_users_email_confirmation_webhook on auth.users;

create trigger auth_users_email_confirmation_webhook
after update on auth.users
for each row
when (
  coalesce(to_jsonb(old)->>'email_confirmed_at', to_jsonb(old)->>'confirmed_at') is null
  and coalesce(to_jsonb(new)->>'email_confirmed_at', to_jsonb(new)->>'confirmed_at') is not null
)
execute function supabase_functions.http_request(
  'http://192.168.1.55:3000/api/v1/webhooks/supabase/email-confirmation',
  'POST',
  '{"Content-Type":"application/json","x-webhook-secret":"7fadb59f5897f37a24bebb06724780e51fd3971930bbaefeb57bb4d348684108"}',
  '{}',
  '1000'
);

-- Verify trigger was created
select 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
from information_schema.triggers 
where trigger_name = 'auth_users_email_confirmation_webhook';

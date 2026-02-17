-- ============================================
-- EMAIL VERIFICATION WEBHOOK SETUP (Using pg_net)
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Enable pg_net extension (if not already enabled)
create extension if not exists pg_net;

-- Step 2: Create the webhook function
-- This function will be called when email is confirmed
create or replace function public.handle_email_verification()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Only trigger when email_confirmed_at changes from null to not null
  if (old.email_confirmed_at is null and new.email_confirmed_at is not null) 
     or (old.confirmed_at is null and new.confirmed_at is not null) then
    
    -- Make HTTP request to your backend
    perform net.http_post(
      url := 'http://192.168.1.55:3000/api/v1/webhooks/supabase/email-confirmation',
      headers := '{"Content-Type": "application/json", "x-webhook-secret": "7fadb59f5897f37a24bebb06724780e51fd3971930bbaefeb57bb4d348684108"}'::jsonb,
      body := jsonb_build_object(
        'type', 'UPDATE',
        'table', 'auth.users',
        'record', jsonb_build_object(
          'id', new.id,
          'email', new.email,
          'email_confirmed_at', coalesce(new.email_confirmed_at, new.confirmed_at)
        )
      )
    );
  end if;
  
  return new;
end;
$$;

-- Step 3: Drop existing trigger if exists
drop trigger if exists auth_users_email_confirmation_webhook on auth.users;

-- Step 4: Create the trigger
create trigger auth_users_email_confirmation_webhook
  after update on auth.users
  for each row
  execute function public.handle_email_verification();

-- Step 5: Verify everything was created
select 
  'Extension pg_net' as check_item,
  case when exists (select 1 from pg_extension where extname = 'pg_net') 
    then '✅ Enabled' 
    else '❌ Not enabled' 
  end as status
union all
select 
  'Function handle_email_verification' as check_item,
  case when exists (select 1 from pg_proc where proname = 'handle_email_verification') 
    then '✅ Created' 
    else '❌ Not created' 
  end as status
union all
select 
  'Trigger auth_users_email_confirmation_webhook' as check_item,
  case when exists (
    select 1 from information_schema.triggers 
    where trigger_name = 'auth_users_email_confirmation_webhook'
  ) 
    then '✅ Active' 
    else '❌ Not active' 
  end as status;

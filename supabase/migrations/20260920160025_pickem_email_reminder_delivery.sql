create or replace function public.accept_pickem_email_reminder(worker_secret text, target_delivery_id uuid, target_claim_token uuid, resend_message_id text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not private.product_email_worker_authorized(worker_secret) then raise exception 'Invalid worker credentials'; end if;
  update private.pickem_reminder_deliveries set status = 'provider_accepted', provider_message_id = resend_message_id,
    provider_accepted_at = now(), claimed_at = null, claim_token = null, updated_at = now()
  where id = target_delivery_id and status = 'processing' and claim_token = target_claim_token;
  return found;
end;
$$;

create or replace function public.fail_pickem_email_reminder(worker_secret text, target_delivery_id uuid, target_claim_token uuid, failure_detail text, retryable boolean)
returns text language plpgsql security definer set search_path = '' as $$
declare new_status text;
begin
  if not private.product_email_worker_authorized(worker_secret) then raise exception 'Invalid worker credentials'; end if;
  select case when retryable and attempt_count < 5 then 'retryable' else 'terminal_failed' end into new_status
  from private.pickem_reminder_deliveries where id = target_delivery_id and status = 'processing' and claim_token = target_claim_token;
  if new_status is null then return null; end if;
  update private.pickem_reminder_deliveries set status = new_status, next_attempt_at = case when new_status = 'retryable' then now() + interval '15 minutes' else next_attempt_at end,
    last_error = left(failure_detail, 1000), claimed_at = null, claim_token = null, updated_at = now() where id = target_delivery_id;
  return new_status;
end;
$$;

create or replace function public.unsubscribe_member_product_email(worker_secret text, target_user_id uuid, unsubscribe_category text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not private.product_email_worker_authorized(worker_secret) then raise exception 'Invalid product email worker credentials'; end if;
  if unsubscribe_category not in ('final_score', 'new_coverage', 'pickem_reminder', 'all') then raise exception 'Unsupported unsubscribe category'; end if;
  if not exists (select 1 from auth.users where id = target_user_id) then return false; end if;

  update public.member_notification_preferences preferences
  set final_score_email = case when unsubscribe_category in ('final_score', 'all') then false else preferences.final_score_email end,
      new_coverage_email = case when unsubscribe_category in ('new_coverage', 'all') then false else preferences.new_coverage_email end,
      pickem_reminder_email = case when unsubscribe_category in ('pickem_reminder', 'all') then false else preferences.pickem_reminder_email end,
      updated_at = now() where preferences.user_id = target_user_id;

  update private.product_email_deliveries set status = 'cancelled', cancelled_at = now(), claimed_at = null, claim_token = null,
    last_error = 'Member unsubscribed before provider send', updated_at = now()
  where recipient_user_id = target_user_id and status in ('pending', 'retryable')
    and (unsubscribe_category = 'all' or category = unsubscribe_category);
  update private.pickem_reminder_deliveries set status = 'cancelled', cancelled_at = now(), claimed_at = null, claim_token = null,
    last_error = 'Member unsubscribed before provider send', updated_at = now()
  where recipient_user_id = target_user_id and status in ('pending', 'retryable') and unsubscribe_category in ('pickem_reminder', 'all');
  return true;
end;
$$;

revoke all on function public.enqueue_pickem_email_reminders(text) from public, anon, authenticated;
revoke all on function public.claim_pickem_email_reminder(text) from public, anon, authenticated;
revoke all on function public.accept_pickem_email_reminder(text, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.fail_pickem_email_reminder(text, uuid, uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.enqueue_pickem_email_reminders(text) to anon, authenticated;
grant execute on function public.claim_pickem_email_reminder(text) to anon, authenticated;
grant execute on function public.accept_pickem_email_reminder(text, uuid, uuid, text) to anon, authenticated;
grant execute on function public.fail_pickem_email_reminder(text, uuid, uuid, text, boolean) to anon, authenticated;

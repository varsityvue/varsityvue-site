-- Local candidate only. The repaired UI binds a decision to the reviewed candidate.
create or replace function public.admin_decide_pickem_winner_claim_reviewed(
  p_week_id uuid, p_decision text, p_reason text,
  p_expected_winner_id uuid, p_expected_generation integer)
returns void language plpgsql security definer set search_path = '' as $$
declare candidate uuid; current_generation integer; current_state text;
begin
  if auth.uid() is null or not private.is_active_member(auth.uid())
    or not private.has_role('admin'::public.user_role) then
    raise exception using errcode='42501', message='Administrator access required';
  end if;
  select generation, state into current_generation, current_state
    from private.pickem_contest_finalizations where week_id=p_week_id for update;
  select contact.user_id into candidate
    from public.admin_pickem_provisional_winner_contact(p_week_id) contact;
  if current_state is distinct from 'current' or candidate is null
    or p_expected_winner_id is null or p_expected_generation is null
    or candidate is distinct from p_expected_winner_id
    or current_generation is distinct from p_expected_generation then
    raise exception 'The reviewed candidate changed. Refresh status and review the current winner';
  end if;
  -- Original function retains all eligibility, deadlines, audit and authorization checks.
  perform public.admin_decide_pickem_winner_claim(p_week_id,p_decision,p_reason);
end; $$;
revoke all on function public.admin_decide_pickem_winner_claim_reviewed(uuid,text,text,uuid,integer) from public,anon;
grant execute on function public.admin_decide_pickem_winner_claim_reviewed(uuid,text,text,uuid,integer) to authenticated;

-- Harden the participation foundation after Supabase security-advisor review.

-- Make the public leaderboard respect the querying user's permissions rather
-- than the view creator's privileges.
alter view public.pickem_standings set (security_invoker = true);

-- Fix mutable search_path warning on the timestamp trigger helper.
alter function public.set_updated_at() set search_path = public, pg_temp;

-- Trigger-only SECURITY DEFINER functions should never be callable through the
-- public REST/RPC surface.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.log_score_submission_created() from public, anon, authenticated;

-- Role helpers are intentionally SECURITY DEFINER so RLS checks do not recurse
-- through user_roles. Anonymous callers never need these helpers.
revoke execute on function public.has_role(public.user_role) from public, anon;
revoke execute on function public.can_moderate_scores() from public, anon;
grant execute on function public.has_role(public.user_role) to authenticated;
grant execute on function public.can_moderate_scores() to authenticated;

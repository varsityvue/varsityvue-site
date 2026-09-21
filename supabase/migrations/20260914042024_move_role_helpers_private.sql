-- Keep RLS role helpers out of the exposed public API schema.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.has_role(required_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = required_role
  );
$$;

create or replace function private.can_moderate_scores()
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select private.has_role('moderator') or private.has_role('admin');
$$;

grant execute on function private.has_role(public.user_role) to authenticated;
grant execute on function private.can_moderate_scores() to authenticated;

-- Rebuild policies that depend on the role helpers.
drop policy "Users can read own roles" on public.user_roles;
create policy "Users can read own roles"
on public.user_roles for select to authenticated
using (user_id = auth.uid() or private.can_moderate_scores());

drop policy "Moderators can insert game state" on public.game_state;
create policy "Moderators can insert game state"
on public.game_state for insert to authenticated
with check (private.can_moderate_scores());

drop policy "Moderators can update game state" on public.game_state;
create policy "Moderators can update game state"
on public.game_state for update to authenticated
using (private.can_moderate_scores())
with check (private.can_moderate_scores());

drop policy "Users can read own score submissions" on public.score_submissions;
create policy "Users can read own score submissions"
on public.score_submissions for select to authenticated
using (submitted_by = auth.uid() or private.can_moderate_scores());

drop policy "Moderators can update score submissions" on public.score_submissions;
create policy "Moderators can update score submissions"
on public.score_submissions for update to authenticated
using (private.can_moderate_scores())
with check (private.can_moderate_scores());

drop policy "Users can read events for visible submissions" on public.score_submission_events;
create policy "Users can read events for visible submissions"
on public.score_submission_events for select to authenticated
using (
  exists (
    select 1 from public.score_submissions s
    where s.id = submission_id
      and (s.submitted_by = auth.uid() or private.can_moderate_scores())
  )
);

drop policy "Moderators manage pickem weeks" on public.pickem_weeks;
create policy "Moderators manage pickem weeks"
on public.pickem_weeks for all to authenticated
using (private.can_moderate_scores())
with check (private.can_moderate_scores());

drop policy "Moderators manage pickem games" on public.pickem_games;
create policy "Moderators manage pickem games"
on public.pickem_games for all to authenticated
using (private.can_moderate_scores())
with check (private.can_moderate_scores());

drop policy "Users can read own picks" on public.pickem_picks;
create policy "Users can read own picks"
on public.pickem_picks for select to authenticated
using (user_id = auth.uid() or private.can_moderate_scores());

revoke execute on function public.has_role(public.user_role) from public, anon, authenticated;
revoke execute on function public.can_moderate_scores() from public, anon, authenticated;
drop function public.can_moderate_scores();
drop function public.has_role(public.user_role);

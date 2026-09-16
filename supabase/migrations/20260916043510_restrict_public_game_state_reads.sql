drop policy if exists "Game state is publicly readable" on public.game_state;

create policy "Verified game state is anonymously readable"
on public.game_state
for select
to anon
using (verified);

create policy "Verified game state is readable to members"
on public.game_state
for select
to authenticated
using (
  verified
  or (select private.can_moderate_scores())
);

export default function PickemLocalNavigation({ member }: { member: boolean }) {
  return <nav aria-label="Pick ’Em sections" className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
    {member && <a href="#my-picks" className="rounded-lg border border-white/25 px-3 py-3 text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">My Pick ’Em</a>}
    <a href="#weekly-standings" className="rounded-lg border border-white/25 px-3 py-3 text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Weekly standings</a>
    <a href="#season-leaderboard" className="rounded-lg border border-white/25 px-3 py-3 text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Season leaderboard</a>
  </nav>;
}

export default function GamesLoading() {
  return (
    <main className="weekly-page">
      <div className="weekly-container" role="status" aria-busy="true">
        <h1 className="text-3xl font-black">Games &amp; Scores</h1>
        <p className="mt-4 text-white/75">Loading the weekly slate…</p>
      </div>
    </main>
  );
}

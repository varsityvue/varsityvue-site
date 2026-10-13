"use client";
export default function Error({ reset }: { reset: () => void }) {
  return <main className="p-8"><h1>Pick ’Em status could not be loaded</h1><p>An earlier operation may already have succeeded. Reload status before repeating any administrative operation.</p><button onClick={reset}>Retry loading status</button><a href="/internal/pickem/submissions">Return to week selection</a></main>;
}

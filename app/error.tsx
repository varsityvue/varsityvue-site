"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen bg-black px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--vv-accent)]">
          VarsityVue
        </p>

        <h1 className="mt-4 text-4xl font-black sm:text-6xl">
          Something went wrong.
        </h1>

        <p className="mt-6 text-lg leading-8 text-white/60">
          The page hit an unexpected error. Try again, or head back to a live VarsityVue section.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-full bg-[var(--vv-primary)] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-[var(--vv-accent)]"
          >
            Try Again
          </button>

          <Link
            href="/scoreboard"
            className="rounded-full border border-white/15 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/10"
          >
            View Scoreboard
          </Link>

          <Link
            href="/"
            className="rounded-full border border-white/15 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/10"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}

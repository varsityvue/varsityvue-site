"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center bg-black px-4 py-10 text-white sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto w-full max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:text-sm sm:tracking-[0.3em]">
          VarsityVue
        </p>

        <h1 className="mt-3 text-3xl font-black leading-tight sm:mt-4 sm:text-6xl">
          Something went wrong.
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/60 sm:mt-6 sm:text-lg sm:leading-8">
          The page hit an unexpected error. Try again, or head back to a live VarsityVue section.
        </p>

        <div className="mx-auto mt-7 grid max-w-md grid-cols-2 gap-2.5 sm:mt-10 sm:flex sm:max-w-none sm:flex-wrap sm:justify-center sm:gap-4">
          <button
            type="button"
            onClick={() => reset()}
            className="col-span-2 rounded-full bg-[var(--vv-primary)] px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-[var(--vv-accent)] sm:col-auto sm:px-6 sm:text-sm sm:tracking-[0.18em]"
          >
            Try Again
          </button>

          <Link
            href="/scoreboard"
            className="rounded-full border border-white/15 px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-white/10 sm:px-6 sm:text-sm sm:tracking-[0.18em]"
          >
            Scoreboard
          </Link>

          <Link
            href="/"
            className="rounded-full border border-white/15 px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-white/10 sm:px-6 sm:text-sm sm:tracking-[0.18em]"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}

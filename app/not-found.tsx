import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-black px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#d65a6d]">
          404
        </p>

        <h1 className="mt-4 text-4xl font-black sm:text-6xl">
          Page Not Found
        </h1>

        <p className="mt-6 text-lg leading-8 text-white/60">
          This VarsityVue page does not exist yet, or the route has moved.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/schools"
            className="rounded-full bg-[#7A1022] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#d65a6d]"
          >
            View Schools
          </Link>

          <Link
            href="/games"
            className="rounded-full border border-white/15 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/10"
          >
            View Games
          </Link>
        </div>
      </div>
    </main>
  );
}
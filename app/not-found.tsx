export default function NotFound() {
  return (
    <main className="min-h-screen bg-black px-6 py-20 text-white">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm uppercase tracking-[0.3em] text-[#d65a6d]">
          VarsityVue
        </p>

        <h1 className="mt-4 text-5xl font-black md:text-7xl">
          Page Not Found
        </h1>

        <p className="mt-6 max-w-2xl text-xl leading-8 text-white/60">
          This page does not exist yet, or the link may have changed.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="/schools"
            className="rounded-full bg-[#7A1022] px-6 py-4 text-center font-semibold hover:bg-[#93142a]"
          >
            Browse Schools
          </a>

          <a
            href="/games"
            className="rounded-full border border-white/20 px-6 py-4 text-center font-semibold hover:bg-white/10"
          >
            View Games
          </a>
        </div>
      </div>
    </main>
  );
}
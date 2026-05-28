import Link from "next/link";

export const metadata = {
  title: "Recommend Your School | VarsityVue",
  description:
    "Recommend a school for VarsityVue coverage and help bring better local sports visibility to your community.",
};

export default function RecommendSchoolPage() {
  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-10 text-white sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-white/60">
          Bring VarsityVue to Your Town
        </p>

        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
          Recommend your school.
        </h1>

        <p className="mt-5 text-lg leading-8 text-white/65">
          Like what you see? Tell us which school should be next. VarsityVue is
          building better local sports visibility for athletes, families,
          alumni, and hometown fans.
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/35 p-5">
          <p className="text-sm font-bold leading-7 text-white/65">
            Full recommendation form coming soon. For now, send us the school
            name, town, sport, and why your community should be included.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href="/sponsor-inquiry"
            className="rounded-xl border border-white/15 bg-white/10 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/15"
          >
            Sponsor a School Hub →
          </Link>

          <Link
            href="/schools"
            className="rounded-xl border border-white/10 bg-black/35 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            View School Hubs →
          </Link>
        </div>
      </section>
    </main>
  );
}
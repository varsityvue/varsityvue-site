import { schools } from "../../data/schools";
import SchoolDirectory from "../../components/SchoolDirectory";

export default function SchoolsPage() {
  const pilotSchools = schools.filter((school) => school.status === "pilot");
  const watchlistSchools = schools.filter(
    (school) => school.status === "watchlist"
  );

  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-12 rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d65a6d]">
            VarsityVue Directory
          </p>

          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">
            School Hubs
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/60">
            Search team hubs, schedules, scores, standings, sponsors, and
            coverage across the growing VarsityVue network.
          </p>
        </section>

        <section className="mb-10 grid gap-4 md:grid-cols-3">
          <StatCard label="Schools" value={schools.length.toString()} />
          <StatCard label="Pilot Hubs" value={pilotSchools.length.toString()} />
          <StatCard
            label="Watchlist"
            value={watchlistSchools.length.toString()}
          />
        </section>

        <SchoolDirectory schools={schools} />
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d65a6d]">
        {label}
      </p>
      <p className="mt-3 text-4xl font-black">{value}</p>
    </div>
  );
}
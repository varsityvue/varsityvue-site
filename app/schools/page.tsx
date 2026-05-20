import { schools } from "../../data/schools";
import SchoolDirectory from "../../components/SchoolDirectory";

export default function SchoolsPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-20 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <p className="text-sm uppercase tracking-[0.3em] text-[#d65a6d]">
            VarsityVue Directory
          </p>

          <h1 className="mt-4 text-5xl font-black md:text-7xl">
            Schools We Cover
          </h1>

          <p className="mt-6 max-w-2xl text-xl leading-8 text-white/60">
            Explore team hubs, schedules, scores, standings, sponsors, and
            coverage across the growing VarsityVue network.
          </p>
        </div>

        <div className="mb-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-[#d65a6d]">
              Schools
            </p>
            <p className="mt-3 text-4xl font-black">{schools.length}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-[#d65a6d]">
              Coverage Market
            </p>
            <p className="mt-3 text-4xl font-black">Big Country Pilot</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-[#d65a6d]">
              Status
            </p>
            <p className="mt-3 text-4xl font-black">Pilot</p>
          </div>
        </div>

        <SchoolDirectory schools={schools} />
      </div>
    </main>
  );
}
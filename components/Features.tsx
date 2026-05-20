import { Search, BarChart3, Megaphone, Shield, Map } from "lucide-react";

export default function Features() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-12 max-w-3xl">
        <p className="text-sm uppercase tracking-[0.3em] text-[#d65a6d]">
          Platform Foundation
        </p>

        <h2 className="mt-4 text-4xl font-black">
          More than a sports website.
        </h2>

        <p className="mt-5 text-lg leading-8 text-white/70">
          VarsityVue is being built as a scalable sports media platform with
          searchable schools, district hubs, structured game data, sponsor
          inventory, and future historical archives.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Feature
          icon={<Search />}
          title="School Hubs"
          text="Every school gets a clean home."
        />
        <Feature
          icon={<Map />}
          title="District Hubs"
          text="Follow UIL districts and standings."
        />
        <Feature
          icon={<BarChart3 />}
          title="Structured Data"
          text="Scores, records, rankings, history."
        />
        <Feature
          icon={<Megaphone />}
          title="Sponsor Revenue"
          text="Native sponsor placements."
        />
        <Feature
          icon={<Shield />}
          title="AD Friendly"
          text="Professional, simple, scalable."
        />
      </div>
    </section>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-5 text-[#d65a6d]">{icon}</div>
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-3 text-white/60">{text}</p>
    </div>
  );
}
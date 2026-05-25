import Link from "next/link";
import type { SchoolTheme } from "../types/school-theme";
import { getSponsors } from "@/lib/sponsors";

type SponsorBannerProps = {
  theme: SchoolTheme;
  schoolId: string;
};

export default function SponsorBanner({
  theme,
  schoolId,
}: SponsorBannerProps) {
  const schoolSponsors = getSponsors().filter((sponsor) =>
    sponsor.schoolIds?.includes(schoolId)
  );
  const primarySponsor = schoolSponsors[0];
  const supportingSponsors = schoolSponsors.slice(1, 4);

  if (!primarySponsor) {
    return (
      <section
        className="relative overflow-hidden rounded-[1.75rem] border bg-white/[0.045] shadow-2xl"
        style={{
          borderColor: `${theme.secondary}22`,
          boxShadow: `0 18px 55px ${theme.primary}18`,
        }}
      >
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background: `radial-gradient(circle at top right, ${theme.primary}55, transparent 55%)`,
          }}
        />

        <div className="relative grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
              Premium Sponsor Placement
            </p>

            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
              Own this school hub.
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55">
              Reach parents, athletes, alumni, fans, and local supporters with
              premium placement directly inside this VarsityVue school ecosystem.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <MiniStat label="Visibility" value="High" />
              <MiniStat label="Audience" value="Local" />
              <MiniStat label="Placement" value="Exclusive" />
            </div>
          </div>

          <div className="flex items-center justify-center border-t border-white/10 p-6 lg:border-l lg:border-t-0">
            <Link
              href="/sponsor-inquiry"
              className="rounded-xl border px-6 py-4 text-center text-sm font-black uppercase tracking-[0.16em] transition hover:brightness-110"
              style={{
                borderColor: `${theme.secondary}44`,
                backgroundColor: `${theme.primary}cc`,
                color: theme.secondary,
              }}
            >
              Claim This Placement →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative overflow-hidden rounded-[1.75rem] border bg-white/[0.045] shadow-2xl"
      style={{
        borderColor: `${theme.secondary}22`,
        boxShadow: `0 18px 55px ${theme.primary}18`,
      }}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(circle at top right, ${theme.primary}55, transparent 55%)`,
        }}
      />

      <div className="relative grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <Link
          href={primarySponsor.website || "/sponsors"}
          target={primarySponsor.website ? "_blank" : undefined}
          className="block p-6 transition hover:bg-white/[0.05] sm:p-8"
        >
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
            Presented By
          </p>

          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
            {primarySponsor.name}
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55">
            Proud supporter of VarsityVue school coverage, game-week visibility,
            athlete exposure, and community engagement.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Badge label="School Hub Sponsor" theme={theme} />
            <Badge label="Game Week Visibility" theme={theme} />
            <Badge label="Community Reach" theme={theme} />
          </div>

          <p
            className="mt-6 text-sm font-black uppercase tracking-[0.16em]"
            style={{ color: theme.secondary }}
          >
            Visit Sponsor →
          </p>
        </Link>

        <div className="border-t border-white/10 p-6 lg:border-l lg:border-t-0">
          <p
            className="text-xs font-black uppercase tracking-[0.24em]"
            style={{ color: `${theme.secondary}bb` }}
          >
            Supporting Sponsors
          </p>

          <div className="mt-4 space-y-3">
            {supportingSponsors.length > 0 ? (
              supportingSponsors.map((sponsor) => (
                <Link
                  key={sponsor.id}
                  href={sponsor.website || "/sponsors"}
                  target={sponsor.website ? "_blank" : undefined}
                  className="block rounded-2xl border bg-black/35 p-4 transition hover:bg-white/10"
                  style={{ borderColor: `${theme.secondary}22` }}
                >
                  <p className="font-black text-white">{sponsor.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/40">
                    {sponsor.tier} sponsor
                  </p>
                </Link>
              ))
            ) : (
              <div
                className="rounded-2xl border bg-black/35 p-4"
                style={{ borderColor: `${theme.secondary}22` }}
              >
                <p className="font-black text-white">
                  Supporting placements available
                </p>
                <p className="mt-1 text-sm text-white/45">
                  Add local business visibility under this school hub.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Badge({
  label,
  theme,
}: {
  label: string;
  theme: SchoolTheme;
}) {
  return (
    <div
      className="rounded-full border bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/70"
      style={{ borderColor: `${theme.secondary}22` }}
    >
      {label}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-white/35">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-white">{value}</p>
    </div>
  );
}
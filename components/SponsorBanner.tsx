import Link from "next/link";
import type { SchoolTheme } from "../types/school-theme";
import { getSchoolSponsors } from "../data/sponsors";

type SponsorBannerProps = {
  theme: SchoolTheme;
  schoolId: string;
};

export default function SponsorBanner({
  theme,
  schoolId,
}: SponsorBannerProps) {
  const schoolSponsors = getSchoolSponsors(schoolId);

  if (schoolSponsors.length === 0) {
    return (
      <section>
        <div
          className="rounded-2xl border bg-white/[0.035] px-6 py-5 text-center shadow-lg"
          style={{
            borderColor: `${theme.secondary}33`,
            boxShadow: `0 14px 40px ${theme.primary}18`,
          }}
        >
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white/60">
            Founding Sponsor Opportunity
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            This placement is available
          </h2>

          <p className="mt-2 text-sm text-white/45">
            Premium VarsityVue school sponsorship inventory.
          </p>
        </div>
      </section>
    );
  }

  const sponsor = schoolSponsors[0];

  return (
    <section>
      <Link
        href={sponsor.website || "#"}
        target="_blank"
        className="block"
      >
        <div
          className="rounded-2xl border bg-white/[0.035] px-6 py-5 text-center shadow-lg transition hover:bg-white/[0.06]"
          style={{
            borderColor: `${theme.secondary}33`,
            boxShadow: `0 14px 40px ${theme.primary}18`,
          }}
        >
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white/60">
            Founding Sponsor
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            {sponsor.name}
          </h2>

          <p className="mt-2 text-sm text-white/45">
            Proud supporter of VarsityVue coverage
          </p>
        </div>
      </Link>
    </section>
  );
}
import type { SchoolTheme } from "../types/school-theme";

type SponsorBannerProps = {
  theme: SchoolTheme;
};

export default function SponsorBanner({ theme }: SponsorBannerProps) {
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
          Your Business Here
        </h2>

        <p className="mt-2 text-sm text-white/45">
          Premium school hub placement available.
        </p>
      </div>
    </section>
  );
}
import Link from "next/link";
import { scorekeeperCtaPresentation, type ScorekeeperCtaState } from "@/lib/scorekeeper-cta";

export default function ScorekeeperCta({ state, prefetch }: { state: ScorekeeperCtaState; prefetch?: boolean }) {
  const presentation = scorekeeperCtaPresentation[state];
  return (
    <section aria-label="Scorekeeper participation" className="mt-5 rounded-2xl border border-white/15 bg-white/[0.04] p-4 sm:mt-8 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-white">Help cover local games</h2>
          <p className="mt-1 text-sm leading-6 text-white/75">Help keep local fans updated with accurate LIVE scores for your school.</p>
          <p className="mt-1 text-xs leading-5 text-white/65">{presentation.note}</p>
        </div>
        <Link href={presentation.href} prefetch={prefetch} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          {presentation.label}
        </Link>
      </div>
    </section>
  );
}

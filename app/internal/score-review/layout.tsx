import Link from "next/link";

export default function ScoreReviewLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <div className="border-b border-white/10 bg-[#050505] px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-2">
          <Link
            href="/internal/score-review"
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-white/65 transition hover:border-white/20 hover:text-white"
          >
            Active Queue
          </Link>
          <Link
            href="/internal/score-review/history"
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-white/65 transition hover:border-white/20 hover:text-white"
          >
            Moderation History
          </Link>
        </div>
      </div>
      {children}
    </>
  );
}

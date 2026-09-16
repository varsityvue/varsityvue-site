"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { School } from "@/types/platform";
import type { AccountFollow } from "@/lib/account-follows";
import { unfollowSchool } from "@/app/schools/[slug]/follow-actions";
import ProgramLogo from "./ProgramLogo";

export default function AccountFollowList({
  initialFollows,
  staleFollowCount,
}: {
  initialFollows: AccountFollow[];
  staleFollowCount: number;
}) {
  const [follows, setFollows] = useState(initialFollows);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    status: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function unfollow(school: School) {
    setPendingSlug(school.slug);
    setFeedback(null);
    startTransition(async () => {
      const result = await unfollowSchool(school.slug);
      setPendingSlug(null);
      setFeedback({ status: result.status === "error" ? "error" : "success", message: result.message });
      if (!result.following && result.status === "success") {
        setFollows((current) =>
          current.filter((follow) => follow.school.slug !== school.slug),
        );
      }
    });
  }

  return (
    <section className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--vv-accent)]">
            Member Schools
          </p>
          <h2 className="mt-2 text-2xl font-black">Schools I Follow</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
            Keep your school hubs close for schedules, scores, coverage, and game-night links.
          </p>
        </div>
        <Link
          href="/schools"
          className="w-fit rounded-full border border-white/15 px-4 py-2 text-xs font-black text-white/75 transition hover:border-white/30 hover:text-white"
        >
          Browse Schools
        </Link>
      </div>

      {follows.length > 0 ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {follows.map(({ school }) => {
            const removing = isPending && pendingSlug === school.slug;
            return (
              <article
                key={school.slug}
                className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center sm:h-16 sm:w-16">
                  <ProgramLogo school={school} size="xs" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/schools/${school.slug}`}
                    className="block truncate text-sm font-black text-white transition hover:text-[var(--vv-accent)] sm:text-base"
                  >
                    {school.name}
                  </Link>
                  <p className="mt-1 text-[9px] font-black uppercase tracking-[0.13em] text-emerald-100/70">
                    <span aria-hidden="true">✓ </span>Following
                  </p>
                </div>
                <form action={() => unfollow(school)} className="shrink-0">
                  <button
                    type="submit"
                    disabled={isPending}
                    aria-label={`Unfollow ${school.name}`}
                    className="min-h-10 rounded-full border border-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[0.1em] text-white/55 transition hover:border-red-200/25 hover:bg-red-200/10 hover:text-red-100 disabled:cursor-wait disabled:opacity-50 sm:text-[10px]"
                  >
                    {removing ? "Removing…" : "Unfollow"}
                  </button>
                </form>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-black/15 p-5 sm:p-6">
          <p className="text-sm font-black text-white">You aren&apos;t following any schools yet.</p>
          <p className="mt-1 text-xs leading-5 text-white/45">
            Browse the school directory and follow the programs you want to return to quickly.
          </p>
          <Link
            href="/schools"
            className="mt-4 inline-flex rounded-full bg-[var(--vv-primary)] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#93142a]"
          >
            Find a School
          </Link>
        </div>
      )}

      {staleFollowCount > 0 ? (
        <p className="mt-3 text-xs leading-5 text-amber-100/65">
          {staleFollowCount === 1 ? "One saved school" : `${staleFollowCount} saved schools`} could not be matched to the current school directory.
        </p>
      ) : null}

      {feedback ? (
        <p
          role={feedback.status === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`mt-3 text-xs leading-5 ${feedback.status === "error" ? "text-red-200" : "text-white/50"}`}
        >
          {feedback.message}
        </p>
      ) : null}
    </section>
  );
}

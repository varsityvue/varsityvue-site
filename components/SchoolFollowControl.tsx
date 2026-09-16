"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  followSchool,
  unfollowSchool,
  type SchoolFollowActionState,
} from "@/app/schools/[slug]/follow-actions";

type SchoolFollowControlProps = {
  schoolName: string;
  schoolSlug: string;
  isAuthenticated: boolean;
  isFollowing: boolean;
};

const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.11em] transition disabled:cursor-wait disabled:opacity-60 sm:min-h-11 sm:px-5 sm:text-xs";

export default function SchoolFollowControl({
  schoolName,
  schoolSlug,
  isAuthenticated,
  isFollowing,
}: SchoolFollowControlProps) {
  const [state, setState] = useState<SchoolFollowActionState>({
    following: isFollowing,
    status: "idle",
    message: "",
  });
  const [pending, startTransition] = useTransition();

  function follow() {
    startTransition(async () => setState(await followSchool(schoolSlug)));
  }

  function unfollow() {
    startTransition(async () => setState(await unfollowSchool(schoolSlug)));
  }

  if (!isAuthenticated) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(`/schools/${schoolSlug}`)}`}
        className={`${buttonClass} border-white/20 bg-white/10 text-white hover:bg-white/15`}
      >
        Follow {schoolName}
      </Link>
    );
  }

  return (
    <div className="flex min-w-0 flex-col items-start gap-1.5">
      {state.following ? (
        <div className="flex flex-wrap items-center gap-2">
          <span
            role="status"
            className={`${buttonClass} border-emerald-300/25 bg-emerald-300/10 text-emerald-50`}
          >
            <span aria-hidden="true">✓&nbsp;</span> Following
          </span>
          <form action={unfollow}>
            <button
              type="submit"
              disabled={pending}
              className="min-h-10 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-white/55 underline decoration-white/25 underline-offset-4 transition hover:text-white disabled:cursor-wait disabled:opacity-60 sm:min-h-11 sm:text-xs"
              aria-label={`Unfollow ${schoolName}`}
            >
              {pending ? "Removing…" : "Unfollow"}
            </button>
          </form>
        </div>
      ) : (
        <form action={follow}>
          <button
            type="submit"
            disabled={pending}
            className={`${buttonClass} border-white/20 bg-white/10 text-white hover:bg-white/15`}
          >
            {pending ? "Following…" : `Follow ${schoolName}`}
          </button>
        </form>
      )}
      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`max-w-xs text-[10px] leading-4 ${
            state.status === "error" ? "text-red-200" : "text-white/50"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

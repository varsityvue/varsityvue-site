"use client";

import { useActionState } from "react";
import {
  beginSignedOutSchoolFollow,
  manageSchoolFollow,
  type SchoolFollowActionState,
} from "@/app/schools/[slug]/follow-actions";

type SchoolFollowControlProps = {
  schoolName: string;
  schoolSlug: string;
  isAuthenticated: boolean;
  isFollowing: boolean;
  finishFollowing?: boolean;
  initialMessage?: string;
};

const buttonClass =
  "inline-flex min-h-10 items-center justify-center rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.11em] transition disabled:cursor-wait disabled:opacity-60 sm:min-h-11 sm:px-5 sm:text-xs";

export default function SchoolFollowControl({
  schoolName,
  schoolSlug,
  isAuthenticated,
  isFollowing,
  finishFollowing = false,
  initialMessage = "",
}: SchoolFollowControlProps) {
  const initialState: SchoolFollowActionState = {
    following: isFollowing,
    status: "idle",
    message: initialMessage,
  };
  const manageFollow = manageSchoolFollow.bind(null, schoolSlug);
  const schoolHubPermalink = `/schools/${encodeURIComponent(schoolSlug)}`;
  const [state, formAction, pending] = useActionState(
    manageFollow,
    initialState,
    schoolHubPermalink,
  );

  if (!isAuthenticated) {
    const beginFollow = beginSignedOutSchoolFollow.bind(null, schoolSlug);
    return (
      <form action={beginFollow}>
        <button
          type="submit"
          className={`${buttonClass} border-white/20 bg-white/10 text-white hover:bg-white/15`}
        >
          Follow {schoolName}
        </button>
      </form>
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
          <form action={formAction}>
            <input type="hidden" name="operation" value="unfollow" />
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
        <form action={formAction}>
          <input type="hidden" name="operation" value="follow" />
          <button
            type="submit"
            disabled={pending}
            className={`${buttonClass} border-white/20 bg-white/10 text-white hover:bg-white/15`}
          >
            {pending
              ? "Following…"
              : finishFollowing
                ? `Finish Following ${schoolName}`
                : `Follow ${schoolName}`}
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

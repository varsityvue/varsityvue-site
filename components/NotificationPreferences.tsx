"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  type NotificationPreferenceState,
  updateNotificationPreference,
} from "@/app/account/notification-actions";

type PreferenceCategory = "final_score" | "new_coverage";

type PreferenceRowProps = {
  category: PreferenceCategory;
  description: string;
  enabled: boolean;
  formAction: (payload: FormData) => void;
  label: string;
  pending: boolean;
};

function PreferenceRow({ category, description, enabled, formAction, label, pending }: PreferenceRowProps) {
  return (
    <div className="flex flex-col gap-4 border-t border-white/10 py-5 first:border-t-0 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-sm font-black text-white">{label}</p>
        <p className="mt-1 text-sm leading-6 text-white/50">{description}</p>
      </div>
      <form action={formAction} className="shrink-0">
        <input type="hidden" name="category" value={category} />
        <input type="hidden" name="enabled" value={String(!enabled)} />
        <button
          type="submit"
          role="switch"
          aria-checked={enabled}
          aria-label={`${label}: ${enabled ? "on" : "off"}`}
          disabled={pending}
          className={`flex min-h-11 min-w-24 items-center justify-between gap-3 rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--vv-accent)] disabled:cursor-wait disabled:opacity-60 ${
            enabled
              ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
              : "border-white/15 bg-black/25 text-white/55 hover:border-white/30 hover:text-white/80"
          }`}
        >
          <span>{enabled ? "On" : "Off"}</span>
          <span
            aria-hidden="true"
            className={`h-5 w-5 rounded-full border transition ${
              enabled ? "border-emerald-100/60 bg-emerald-200" : "border-white/20 bg-white/10"
            }`}
          />
        </button>
      </form>
    </div>
  );
}

export default function NotificationPreferences({
  finalScoreEmail,
  newCoverageEmail,
  followCount,
}: {
  finalScoreEmail: boolean;
  newCoverageEmail: boolean;
  followCount: number;
}) {
  const initialState: NotificationPreferenceState = {
    status: "idle",
    message: "",
    preferences: { finalScoreEmail, newCoverageEmail },
  };
  const [state, formAction, pending] = useActionState(updateNotificationPreference, initialState);
  const preferences = state.preferences;

  return (
    <section className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 sm:p-7">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--vv-accent)]">
        Notifications
      </p>
      <h2 className="mt-2 text-2xl font-black">Email preferences</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
        Choose which email updates you want for schools you follow. Following a school does not turn these on.
      </p>

      {followCount === 0 ? (
        <p className="mt-3 text-sm text-white/45">
          You do not follow a school yet. You can set preferences now or{" "}
          <Link href="/schools" className="font-bold text-white/75 underline decoration-white/25 underline-offset-4 hover:text-white">
            find a school
          </Link>
          .
        </p>
      ) : null}

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
        <PreferenceRow
          category="final_score"
          label="Final Score Email"
          description="Get an email when a followed school's game reaches a verified final."
          enabled={preferences.finalScoreEmail}
          formAction={formAction}
          pending={pending}
        />
        <PreferenceRow
          category="new_coverage"
          label="New Coverage Email"
          description="Get an email when VarsityVue publishes new coverage about a school you follow."
          enabled={preferences.newCoverageEmail}
          formAction={formAction}
          pending={pending}
        />
      </div>

      <p
        aria-live="polite"
        className={`mt-4 min-h-5 text-sm ${state.status === "error" ? "text-red-200" : "text-emerald-100/80"}`}
      >
        {state.message}
      </p>
    </section>
  );
}

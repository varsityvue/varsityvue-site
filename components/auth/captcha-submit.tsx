"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { track } from "@vercel/analytics";
import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

type CaptchaSubmitProps = {
  action: "signin" | "signup" | "password_reset";
  label: string;
  siteKey?: string;
  schoolSlug?: string;
  sourceIntent?: "account" | "follow" | "score_report";
};

export function CaptchaSubmit({ action, label, siteKey, schoolSlug, sourceIntent }: CaptchaSubmitProps) {
  const { pending } = useFormStatus();
  const turnstile = useRef<TurnstileInstance | null>(null);
  const wasPending = useRef(false);
  const [verified, setVerified] = useState(false);
  const [status, setStatus] = useState<"checking" | "ready" | "expired" | "failed">(
    "checking",
  );

  const unavailable = !siteKey || status === "failed";

  useEffect(() => {
    if (wasPending.current && !pending) {
      setVerified(false);
      setStatus("checking");
      turnstile.current?.reset();
    }
    wasPending.current = pending;
  }, [pending]);

  return (
    <div className="space-y-4">
      {siteKey ? (
        <div className="min-h-[65px] w-full overflow-hidden rounded-xl">
          <Turnstile
            ref={turnstile}
            siteKey={siteKey}
            onSuccess={() => {
              setVerified(true);
              setStatus("ready");
            }}
            onExpire={() => {
              setVerified(false);
              setStatus("expired");
            }}
            onError={() => {
              setVerified(false);
              setStatus("failed");
            }}
            onTimeout={() => {
              setVerified(false);
              setStatus("expired");
            }}
            onUnsupported={() => {
              setVerified(false);
              setStatus("failed");
            }}
            options={{
              action,
              appearance: "interaction-only",
              refreshExpired: "auto",
              refreshTimeout: "auto",
              responseField: true,
              responseFieldName: "captcha_token",
              retry: "auto",
              size: "flexible",
              theme: "dark",
            }}
          />
        </div>
      ) : null}

      <p
        aria-live="polite"
        className={`text-xs leading-5 ${unavailable ? "text-amber-100" : "text-white/45"}`}
      >
        {status === "ready"
          ? "Security check complete."
          : status === "expired"
            ? "The security check expired. Please wait for it to refresh."
            : unavailable
              ? "The security check could not load. Refresh the page and try again."
              : "Completing a brief security check…"}
      </p>

      <button
        type="submit"
        disabled={!verified || pending || unavailable}
        aria-disabled={!verified || pending || unavailable}
        onClick={() => {
          if (action === "signup") {
            track("Signup Submitted", {
              intent: sourceIntent ?? "account",
              school: schoolSlug,
            });
          }
        }}
        className="w-full rounded-full bg-[var(--vv-primary)] px-6 py-3.5 text-sm font-black transition hover:bg-[#93142a] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-[var(--vv-primary)]"
      >
        {pending ? "Please wait…" : label}
      </button>
    </div>
  );
}

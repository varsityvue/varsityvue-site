import {
  isAuthPKCECodeVerifierMissingError,
  type EmailOtpType,
} from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { trackConversion } from "@/lib/conversion-analytics";
import { safeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const flowId = searchParams.get("sb_flow_id");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));
  const redirectTo = request.nextUrl.clone();

  redirectTo.search = "";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined,
    );

    if (!error) {
      trackConversion("Account Confirmed", {
        intent: next.startsWith("/follow/complete?")
          ? "follow"
          : next.startsWith("/report-score")
            ? "score_report"
            : next.startsWith("/pickem")
              ? "pickem"
              : "account",
      });
      const destination = new URL(next, request.url);
      destination.searchParams.set("confirmed", "1");
      return NextResponse.redirect(destination);
    }

    if (isAuthPKCECodeVerifierMissingError(error)) {
      redirectTo.pathname = "/login";
      redirectTo.searchParams.set("status", "confirmation-cross-device");
      if (next !== "/account") redirectTo.searchParams.set("next", next);
      return NextResponse.redirect(redirectTo);
    }
  }

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      trackConversion("Account Confirmed", {
        intent: next.startsWith("/follow/complete?")
          ? "follow"
          : next.startsWith("/report-score")
            ? "score_report"
            : next.startsWith("/pickem")
              ? "pickem"
              : "account",
      });
      const destination = new URL(next, request.url);
      destination.searchParams.set("confirmed", "1");
      return NextResponse.redirect(destination);
    }
  }

  redirectTo.pathname = "/login";
  redirectTo.searchParams.set(
    "message",
    "We could not confirm that email link. Please try signing in or request a new confirmation email.",
  );
  if (next !== "/account") redirectTo.searchParams.set("next", next);
  return NextResponse.redirect(redirectTo);
}

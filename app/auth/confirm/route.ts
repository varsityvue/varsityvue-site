import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/account";
  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));
  const redirectTo = request.nextUrl.clone();

  redirectTo.search = "";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
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

import { isAuthPKCECodeVerifierMissingError } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const recoveryCookie = "vv_password_recovery";

function invalidLinkResponse(request: NextRequest) {
  const destination = new URL("/reset-password", request.url);
  destination.searchParams.set("error", "invalid-link");
  const response = NextResponse.redirect(destination);
  response.cookies.delete(recoveryCookie);
  return response;
}

function verifiedRecoveryResponse(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/reset-password", request.url));
  response.cookies.set(recoveryCookie, "verified", {
    httpOnly: true,
    maxAge: 15 * 60,
    path: "/",
    sameSite: "lax",
    secure: true,
  });
  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const code = searchParams.get("code");
  const flowId = searchParams.get("sb_flow_id");

  if (tokenHash && type === "recovery") {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });

    if (!error) {
      return verifiedRecoveryResponse(request);
    }
  } else if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined,
    );

    if (!error) {
      return verifiedRecoveryResponse(request);
    }

    if (isAuthPKCECodeVerifierMissingError(error)) {
      return invalidLinkResponse(request);
    }
  }

  return invalidLinkResponse(request);
}

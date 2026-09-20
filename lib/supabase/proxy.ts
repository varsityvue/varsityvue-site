import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { ATTRIBUTION_COOKIE, normalizedAttribution, serializeAttribution } from "@/lib/campaign-attribution";

export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = getSupabaseConfig();
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

        supabaseResponse = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );

        Object.entries(headers).forEach(([key, value]) =>
          supabaseResponse.headers.set(key, value),
        );
      },
    },
  });

  await supabase.auth.getClaims();

  if (!request.cookies.has(ATTRIBUTION_COOKIE)) {
    const attribution = normalizedAttribution({
      source: request.nextUrl.searchParams.get("utm_source") ?? undefined,
      campaign: request.nextUrl.searchParams.get("utm_campaign") ?? undefined,
      landing: `${request.nextUrl.pathname}${request.nextUrl.search}`,
    });
    if (attribution) {
      supabaseResponse.cookies.set(ATTRIBUTION_COOKIE, serializeAttribution(attribution), {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
        sameSite: "lax",
        secure: true,
      });
    }
  }

  return supabaseResponse;
}

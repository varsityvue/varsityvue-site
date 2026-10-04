import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // Anonymous regional summaries must never pass through session refresh.
  if (["/api/coverage-demand", "/api/cron/coverage-demand-retention", "/api/cron/coverage-demand-fleet",
    "/api/coverage-demand-fleet/recovery"].includes(request.nextUrl.pathname)) return NextResponse.next();

  if (request.nextUrl.pathname === "/Pickem") {
    const destination = request.nextUrl.clone();
    destination.pathname = "/pickem";
    return NextResponse.redirect(destination, 308);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

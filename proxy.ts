import { NextResponse, type NextRequest } from "next/server";
import { scoresDestination } from "@/lib/games-route-compatibility";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // Redirect before rendering/streaming so incoming browser fragments survive the HTTP hop.
  if (request.nextUrl.pathname === "/scoreboard") {
    return NextResponse.redirect(
      new URL(
        scoresDestination(Object.fromEntries(request.nextUrl.searchParams)),
        request.url,
      ),
      308,
    );
  }
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

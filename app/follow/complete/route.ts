import { type NextRequest, NextResponse } from "next/server";
import {
  FOLLOW_INTENT_COOKIE,
  verifyFollowIntent,
} from "@/lib/follow-intent";
import {
  createFollowContext,
  sameFollowContext,
  type FollowSourceSurface,
} from "@/lib/follow-context";
import { resolveFollowDestination } from "@/lib/follow-destinations";
import { followSchoolForCurrentUser } from "@/lib/school-follow-mutations";
import { getSchoolBySlug } from "@/lib/schools";
import { createClient } from "@/lib/supabase/server";

function clearIntent(response: NextResponse) {
  response.cookies.set(FOLLOW_INTENT_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function GET(request: NextRequest) {
  const requestedSlug = request.nextUrl.searchParams.get("school") ?? "";
  const school = getSchoolBySlug(requestedSlug);
  if (!school) {
    return clearIntent(NextResponse.redirect(new URL("/schools", request.url)));
  }

  const requestedContext = createFollowContext(
    (request.nextUrl.searchParams.get("surface") ?? "school_hub") as FollowSourceSurface,
    request.nextUrl.searchParams.get("source") ?? undefined,
  );
  const requestedDestination = requestedContext
    ? await resolveFollowDestination(school.slug, requestedContext)
    : null;
  const safeContext = requestedContext && requestedDestination
    ? requestedContext
    : { sourceSurface: "school_hub" as const };
  const safeDestination =
    requestedDestination ?? (await resolveFollowDestination(school.slug, safeContext));
  if (!safeDestination) {
    return clearIntent(NextResponse.redirect(new URL("/schools", request.url)));
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }

  const intent = verifyFollowIntent(
    request.cookies.get(FOLLOW_INTENT_COOKIE)?.value,
  );
  const destination = new URL(safeDestination, request.url);
  const intentContext = intent
    ? createFollowContext(intent.sourceSurface, intent.sourceId)
    : null;

  if (
    !intent ||
    intent.schoolSlug !== school.slug ||
    !intentContext ||
    !sameFollowContext(intentContext, safeContext) ||
    intent.returnTo !== safeDestination
  ) {
    destination.searchParams.set("finishFollow", school.slug);
    return clearIntent(NextResponse.redirect(destination));
  }

  const result = await followSchoolForCurrentUser(
    school.slug,
    intentContext.sourceSurface,
  );
  if (result.status === "suspended") {
    return clearIntent(NextResponse.redirect(new URL("/account-suspended", request.url)));
  }
  if (result.status === "success" && result.following) {
    destination.searchParams.set("followed", school.slug);
  } else {
    destination.searchParams.set("finishFollow", school.slug);
    destination.searchParams.set("followError", "1");
  }
  return clearIntent(NextResponse.redirect(destination));
}

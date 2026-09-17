import { type NextRequest, NextResponse } from "next/server";
import {
  FOLLOW_INTENT_COOKIE,
  verifyFollowIntent,
} from "@/lib/follow-intent";
import { followSchoolForCurrentUser } from "@/lib/school-follow-mutations";
import { getSchoolBySlug } from "@/lib/schools";
import { createClient } from "@/lib/supabase/server";

function schoolDestination(request: NextRequest, schoolSlug: string) {
  return new URL(`/schools/${schoolSlug}`, request.url);
}

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

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `/follow/complete?school=${encodeURIComponent(school.slug)}`);
    return NextResponse.redirect(login);
  }

  const intent = verifyFollowIntent(
    request.cookies.get(FOLLOW_INTENT_COOKIE)?.value,
  );
  const destination = schoolDestination(request, school.slug);

  if (
    !intent ||
    intent.schoolSlug !== school.slug ||
    intent.returnTo !== `/schools/${school.slug}`
  ) {
    destination.searchParams.set("finishFollow", school.slug);
    return clearIntent(NextResponse.redirect(destination));
  }

  const result = await followSchoolForCurrentUser(school.slug);
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

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createFollowIntent,
  FOLLOW_INTENT_COOKIE,
  contextualFollowCompletionPath,
  followIntentCookieOptions,
} from "@/lib/follow-intent";
import {
  createFollowContext,
  type FollowSourceSurface,
} from "@/lib/follow-context";
import { resolveFollowDestination } from "@/lib/follow-destinations";
import { memberAccountStatus } from "@/lib/member-access";
import { followSchoolForCurrentUser } from "@/lib/school-follow-mutations";
import { getSchoolBySlug } from "@/lib/schools";
import { createClient } from "@/lib/supabase/server";

export type SchoolFollowActionState = {
  following: boolean;
  status: "idle" | "success" | "error" | "suspended";
  message: string;
};

async function authenticatedFollowContext(schoolSlug: string) {
  const slug = schoolSlug.trim();
  const school = getSchoolBySlug(slug);

  if (!school) {
    return { ok: false, error: "That school is not available to follow." } as const;
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return { ok: false, error: "Sign in to manage school follows." } as const;
  }

  if (await memberAccountStatus(supabase, userId) !== "active") {
    return { ok: false, suspended: true, error: "Account suspended." } as const;
  }

  return { ok: true, school, slug, supabase, userId } as const;
}

export async function followSchool(
  schoolSlug: string,
): Promise<SchoolFollowActionState> {
  return followSchoolForCurrentUser(schoolSlug);
}

export async function manageSchoolFollow(
  schoolSlug: string,
  sourceSurface: FollowSourceSurface,
  sourceId: string | undefined,
  previousState: SchoolFollowActionState,
  formData: FormData,
): Promise<SchoolFollowActionState> {
  const context = createFollowContext(sourceSurface, sourceId);
  const destination = context
    ? await resolveFollowDestination(schoolSlug, context)
    : null;
  if (!context || !destination) {
    return {
      following: previousState.following,
      status: "error",
      message: "That follow destination is not available.",
    };
  }
  const operation = String(formData.get("operation") ?? "");

  if (operation === "follow") {
    const result = await followSchoolForCurrentUser(schoolSlug, context.sourceSurface);
    if (result.status === "suspended") redirect("/account-suspended");
    if (result.status === "success") {
      const params = new URLSearchParams({ followed: schoolSlug });
      redirect(`${destination}?${params.toString()}`);
    }
    return result;
  }

  if (operation === "unfollow") {
    const result = await unfollowSchool(schoolSlug);
    if (result.status === "suspended") redirect("/account-suspended");
    if (result.status === "success") {
      const params = new URLSearchParams({ unfollowed: schoolSlug });
      redirect(`${destination}?${params.toString()}`);
    }
    return result;
  }

  return {
    following: previousState.following,
    status: "error",
    message: "That follow action is not available.",
  };
}

export async function beginSignedOutSchoolFollow(
  schoolSlug: string,
  sourceSurface: FollowSourceSurface,
  sourceId: string | undefined,
  formData: FormData,
) {
  void formData;
  const school = getSchoolBySlug(schoolSlug.trim());
  if (!school) redirect("/schools");
  const context = createFollowContext(sourceSurface, sourceId);
  const destination = context
    ? await resolveFollowDestination(school.slug, context)
    : null;
  if (!context || !destination) redirect(`/schools/${school.slug}`);

  const cookieStore = await cookies();
  cookieStore.set(
    FOLLOW_INTENT_COOKIE,
    createFollowIntent(school.slug, context),
    followIntentCookieOptions(),
  );

  redirect(
    `/login?next=${encodeURIComponent(contextualFollowCompletionPath(school.slug, context))}&source=follow_${context.sourceSurface}`,
  );
}

export async function unfollowSchool(
  schoolSlug: string,
): Promise<SchoolFollowActionState> {
  const context = await authenticatedFollowContext(schoolSlug);
  if (!context.ok) {
    return {
      following: true,
      status: "suspended" in context && context.suspended ? "suspended" : "error",
      message: context.error,
    };
  }

  const { error } = await context.supabase
    .from("school_follows")
    .delete()
    .eq("user_id", context.userId)
    .eq("school_slug", context.slug);

  if (error) {
    console.error("Unable to unfollow school.", {
      code: error.code,
      schoolSlug: context.slug,
    });
    return {
      following: true,
      status: "error",
      message: "We could not remove this follow. Please try again.",
    };
  }

  return {
    following: false,
    status: "success",
    message: `You are no longer following ${context.school.name}.`,
  };
}

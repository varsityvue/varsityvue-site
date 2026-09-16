"use server";

import { revalidatePath } from "next/cache";
import { getSchoolBySlug } from "@/lib/schools";
import { createClient } from "@/lib/supabase/server";

export type SchoolFollowActionState = {
  following: boolean;
  status: "idle" | "success" | "error";
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

  return { ok: true, school, slug, supabase, userId } as const;
}

export async function followSchool(
  schoolSlug: string,
): Promise<SchoolFollowActionState> {
  const context = await authenticatedFollowContext(schoolSlug);
  if (!context.ok) {
    return { following: false, status: "error", message: context.error };
  }

  const { error } = await context.supabase.from("school_follows").upsert(
    {
      user_id: context.userId,
      school_slug: context.slug,
      source_surface: "school_hub",
    },
    { onConflict: "user_id,school_slug", ignoreDuplicates: true },
  );

  if (error) {
    console.error("Unable to follow school.", {
      code: error.code,
      schoolSlug: context.slug,
    });
    return {
      following: false,
      status: "error",
      message: "We could not save this follow. Please try again.",
    };
  }

  revalidatePath(`/schools/${context.slug}`);
  revalidatePath("/account");
  return {
    following: true,
    status: "success",
    message: `You are now following ${context.school.name}.`,
  };
}

export async function unfollowSchool(
  schoolSlug: string,
): Promise<SchoolFollowActionState> {
  const context = await authenticatedFollowContext(schoolSlug);
  if (!context.ok) {
    return { following: true, status: "error", message: context.error };
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

  revalidatePath(`/schools/${context.slug}`);
  revalidatePath("/account");
  return {
    following: false,
    status: "success",
    message: `You are no longer following ${context.school.name}.`,
  };
}

import "server-only";

import { trackConversion } from "@/lib/conversion-analytics";
import { memberAccountStatus } from "@/lib/member-access";
import { getSchoolBySlug } from "@/lib/schools";
import { createClient } from "@/lib/supabase/server";
import type { FollowSourceSurface } from "@/lib/follow-context";

export type SchoolFollowMutationResult = {
  following: boolean;
  status: "success" | "error" | "suspended";
  message: string;
};

export async function followSchoolForCurrentUser(
  schoolSlug: string,
  sourceSurface: FollowSourceSurface = "school_hub",
): Promise<SchoolFollowMutationResult> {
  const slug = schoolSlug.trim();
  const school = getSchoolBySlug(slug);
  if (!school) {
    return {
      following: false,
      status: "error",
      message: "That school is not available to follow.",
    };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) {
    return {
      following: false,
      status: "error",
      message: "Sign in to manage school follows.",
    };
  }

  if (await memberAccountStatus(supabase, userId) !== "active") {
    return {
      following: false,
      status: "suspended",
      message: "Account suspended.",
    };
  }

  const { error } = await supabase.from("school_follows").upsert(
    {
      user_id: userId,
      school_slug: school.slug,
      source_surface: sourceSurface,
    },
    { onConflict: "user_id,school_slug", ignoreDuplicates: true },
  );

  if (error) {
    console.error("Unable to follow school.", {
      code: error.code,
      schoolSlug: school.slug,
    });
    return {
      following: false,
      status: "error",
      message: "We could not save this follow. Please try again.",
    };
  }

  trackConversion("Follow Completed", {
    school: school.slug,
    surface: sourceSurface,
  });

  return {
    following: true,
    status: "success",
    message: `You are now following ${school.name}.`,
  };
}

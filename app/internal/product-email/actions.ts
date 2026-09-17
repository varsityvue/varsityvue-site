"use server";

import { redirect } from "next/navigation";

import { requireActiveMember } from "@/lib/member-access";
import { getSchoolBySlug } from "@/lib/schools";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function resultPath(key: "message" | "created", message: string) {
  const params = new URLSearchParams({ [key]: message });
  return `/internal/product-email?${params.toString()}`;
}

export async function createControlledProductEmailTest(formData: FormData) {
  const category = value(formData, "category");
  const schoolSlug = value(formData, "school_slug");
  const school = getSchoolBySlug(schoolSlug);
  if ((category !== "final_score" && category !== "new_coverage") || !school) {
    redirect(resultPath("message", "Choose a valid category and canonical school."));
  }

  const { supabase, userId } = await requireActiveMember();
  const [{ data: roles }, { data: follow }, { data: preferences }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.from("school_follows").select("school_slug").eq("user_id", userId).eq("school_slug", schoolSlug).maybeSingle(),
    supabase.from("member_notification_preferences").select("final_score_email, new_coverage_email").eq("user_id", userId).maybeSingle(),
  ]);
  if (!roles?.some((row) => row.role === "admin")) redirect("/account");
  if (!follow) redirect(resultPath("message", `Your admin account must follow ${school.name} before this test can create a delivery.`));
  const categoryEnabled = category === "final_score"
    ? preferences?.final_score_email
    : preferences?.new_coverage_email;
  if (!categoryEnabled) {
    redirect(resultPath("message", `Turn on ${category === "final_score" ? "Final Score Email" : "New Coverage Email"} in your account before testing.`));
  }

  const headline = category === "final_score"
    ? `Controlled final-score email test for ${school.name}`
    : `Controlled coverage email test for ${school.name}`;
  const body = "This controlled Phase 6 test proves the durable product-email delivery path. It is not tied to a real game result or published article.";
  const { data, error } = await supabase.rpc("admin_create_product_email_test_event", {
    event_category: category,
    school_slug: schoolSlug,
    headline,
    body_text: body,
    cta_path: `/schools/${schoolSlug}`,
  });
  const created = data?.[0];
  if (error || !created || created.delivery_count !== 1) {
    console.error("Controlled product-email event could not be created.", { code: error?.code });
    redirect(resultPath("message", "The controlled event was not queued. No email was sent."));
  }

  redirect(resultPath("created", `Controlled test queued (${created.event_id}). The worker will process it on the next cron run.`));
}

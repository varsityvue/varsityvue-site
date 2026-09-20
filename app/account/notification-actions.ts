"use server";

import { revalidatePath } from "next/cache";

import { requireActiveMember } from "@/lib/member-access";

export type NotificationPreferenceState = {
  status: "idle" | "success" | "error";
  message: string;
  preferences: {
    finalScoreEmail: boolean;
    newCoverageEmail: boolean;
    pickemReminderEmail: boolean;
  };
};

export async function updateNotificationPreference(
  previousState: NotificationPreferenceState,
  formData: FormData,
): Promise<NotificationPreferenceState> {
  const category = formData.get("category");
  const enabledValue = formData.get("enabled");

  if (
    (category !== "final_score" && category !== "new_coverage" && category !== "pickem_reminder") ||
    (enabledValue !== "true" && enabledValue !== "false")
  ) {
    return {
      ...previousState,
      status: "error",
      message: "We could not update that notification preference.",
    };
  }

  const { supabase } = await requireActiveMember();
  const { data, error } = await supabase.rpc("set_own_member_notification_preference", {
    preference_category: category,
    enabled: enabledValue === "true",
  });
  const persisted = data?.[0];

  if (error || !persisted) {
    console.error("Unable to update member notification preference.", {
      code: error?.code,
      category,
    });
    return {
      ...previousState,
      status: "error",
      message: "We could not save that change. Your previous setting is still shown.",
    };
  }

  revalidatePath("/account");

  return {
    status: "success",
    message: `${category === "final_score" ? "Final Score Email" : category === "pickem_reminder" ? "Pick ’Em Reminder" : "New Coverage Email"} turned ${enabledValue === "true" ? "on" : "off"}.`,
    preferences: {
      finalScoreEmail: persisted.final_score_email,
      newCoverageEmail: persisted.new_coverage_email,
      pickemReminderEmail: persisted.pickem_reminder_email,
    },
  };
}

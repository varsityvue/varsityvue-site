import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";

type NotificationEvent = {
  event_id: string;
  user_id: string;
  email: string | null;
  display_name: string;
  attempt_count: number;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const FROM_ADDRESS =
  process.env.MEMBER_NOTIFICATION_FROM ??
  "VarsityVue <onboarding@resend.dev>";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function workerClient() {
  const { url, publishableKey } = getSupabaseConfig();
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function recordFailure(
  workerSecret: string,
  eventId: string,
  failure: unknown,
) {
  const detail = failure instanceof Error ? failure.message : String(failure);
  const { error } = await workerClient().rpc("fail_member_notification", {
    worker_secret: workerSecret,
    target_event_id: eventId,
    failure_detail: detail,
  });

  if (error) {
    console.error("Could not persist member-notification failure.", {
      eventId,
      error: error.message,
    });
  }
}

export async function deliverNextMemberNotification() {
  const workerSecret = process.env.MEMBER_NOTIFICATION_WORKER_SECRET;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!workerSecret || !resendApiKey) {
    console.error("Member-notification worker is not configured.", {
      workerSecretConfigured: Boolean(workerSecret),
      resendConfigured: Boolean(resendApiKey),
    });
    return { outcome: "not_configured" as const };
  }

  const client = workerClient();
  const { data, error } = await client.rpc("claim_member_notification", {
    worker_secret: workerSecret,
  });

  if (error) {
    console.error("Could not claim a member-notification event.", error.message);
    return { outcome: "claim_failed" as const };
  }

  const event = (data?.[0] ?? null) as NotificationEvent | null;
  if (!event) return { outcome: "idle" as const };

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `varsityvue-member-notification/${event.event_id}`,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: ["info@varsityvue.com"],
        subject: `New VarsityVue member: ${event.display_name}`,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111"><h2 style="margin-bottom:12px">New VarsityVue member</h2><p>A new account was just created.</p><p><strong>Name:</strong> ${escapeHtml(event.display_name)}<br><strong>Email:</strong> ${escapeHtml(event.email ?? "Not provided")}</p><p style="color:#666;font-size:13px">User ID: ${escapeHtml(event.user_id)}</p></div>`,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { id?: string; message?: string }
      | null;

    if (!response.ok || !payload?.id) {
      throw new Error(
        `Resend delivery failed (${response.status}): ${payload?.message ?? "unknown provider response"}`,
      );
    }

    const { data: completed, error: completionError } = await client.rpc(
      "complete_member_notification",
      {
        worker_secret: workerSecret,
        target_event_id: event.event_id,
        resend_message_id: payload.id,
      },
    );

    if (completionError || completed !== true) {
      throw new Error(
        `Resend accepted the alert, but completion could not be recorded: ${completionError?.message ?? "event state changed"}`,
      );
    }

    console.info("Member notification delivered.", {
      eventId: event.event_id,
      attempt: event.attempt_count,
      providerMessageId: payload.id,
    });
    return { outcome: "delivered" as const, eventId: event.event_id };
  } catch (failure) {
    await recordFailure(workerSecret, event.event_id, failure);
    console.error("Member notification delivery failed.", {
      eventId: event.event_id,
      failure,
    });
    return { outcome: "failed" as const, eventId: event.event_id };
  }
}

export async function drainMemberNotifications(limit = 10) {
  const outcomes = [];

  for (let index = 0; index < limit; index += 1) {
    const result = await deliverNextMemberNotification();
    outcomes.push(result);
    if (result.outcome !== "delivered") break;
  }

  return outcomes;
}

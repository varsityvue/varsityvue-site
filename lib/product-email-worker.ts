import "server-only";

import { createClient } from "@supabase/supabase-js";
import { renderProductEmail, type ProductEmailContentSnapshot } from "@/lib/product-email-renderer";
import { createProductEmailUnsubscribeToken, type ProductEmailCategory } from "@/lib/product-email-unsubscribe";
import { getSupabaseConfig } from "@/lib/supabase/config";

type ClaimedDelivery = {
  delivery_id: string;
  claim_token: string;
  event_id: string;
  category: ProductEmailCategory;
  recipient_user_id: string;
  recipient_email: string;
  attempt_count: number;
  relevant_school_slugs: string[];
  matched_school_slugs: string[];
  content_snapshot: ProductEmailContentSnapshot;
  occurred_at: string;
  test_only: boolean;
};

type ClaimedPickemReminder = {
  delivery_id: string;
  claim_token: string;
  recipient_user_id: string;
  recipient_email: string;
  season: number;
  week_number: number;
  week_title: string;
  lock_at: string;
  picked_count: number;
  game_count: number;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const FROM_ADDRESS = process.env.PRODUCT_EMAIL_FROM ?? "VarsityVue <notifications@varsityvue.com>";

function workerClient() {
  const { url, publishableKey } = getSupabaseConfig();
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function configuration() {
  return {
    workerSecret: process.env.PRODUCT_EMAIL_WORKER_SECRET,
    resendApiKey:
      process.env.PRODUCT_EMAIL_RESEND_API_KEY ?? process.env.RESEND_API_KEY,
  };
}

function retryableStatus(status: number) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

function emailOrigin() {
  return process.env.PRODUCT_EMAIL_SITE_ORIGIN?.trim() || "https://varsityvue.com";
}

function renderPickemReminder(delivery: ClaimedPickemReminder) {
  const completeSelections = delivery.game_count > 0 && delivery.picked_count >= delivery.game_count;
  const entryMessage = completeSelections
    ? "Your selections are saved, but your contest entry is not yet accepted. Complete any remaining entry requirements, including the tiebreaker prediction (if required), mobile number, and eligibility and Official Rules attestation."
    : delivery.picked_count === 0
      ? "Start your picks and complete entry requirements, including the tiebreaker prediction (if required), mobile number, and eligibility and Official Rules attestation."
      : "Finish your picks and complete entry requirements, including the tiebreaker prediction (if required), mobile number, and eligibility and Official Rules attestation.";
  const lockLabel = new Date(delivery.lock_at).toLocaleString("en-US", {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
    timeZoneName: "short",
  });
  const pickemUrl = `${emailOrigin()}/pickem`;
  const token = createProductEmailUnsubscribeToken(delivery.recipient_user_id, "pickem_reminder");
  const unsubscribeUrl = `${emailOrigin()}/email/unsubscribe?token=${encodeURIComponent(token)}`;
  const oneClickUrl = `${emailOrigin()}/api/email/unsubscribe?token=${encodeURIComponent(token)}`;
  const preferenceUrl = `${emailOrigin()}/account#email-preferences`;
  const subject = `Complete your Pick ’Em entry before ${lockLabel}`;
  const html = `<!doctype html><html><body style="margin:0;background:#070707;color:#f7f7f7;font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden">Complete your Pick ’Em entry before the entry deadline.</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#070707"><tr><td align="center" style="padding:28px 14px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;border:1px solid #2b2b2b;border-radius:18px;background:#111111"><tr><td style="padding:28px"><p style="margin:0 0 18px;color:#f2b84b;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase">VarsityVue Pick ’Em</p><h1 style="margin:0;color:#ffffff;font-size:28px;line-height:1.2">Your contest entry is not yet accepted</h1><p style="margin:18px 0 0;color:#d1d1d1;font-size:16px;line-height:1.6">${entryMessage} The entry deadline is ${lockLabel}.</p><p style="margin:24px 0"><a href="${pickemUrl}" style="display:inline-block;border-radius:999px;background:#7a1022;color:#ffffff;padding:13px 20px;text-decoration:none;font-size:14px;font-weight:800">Complete My Entry</a></p><p style="margin:24px 0 0;border-top:1px solid #2b2b2b;padding-top:18px;color:#858585;font-size:12px;line-height:1.6">You enabled Pick ’Em reminders. <a href="${preferenceUrl}" style="color:#c8c8c8">Manage preferences</a> · <a href="${unsubscribeUrl}" style="color:#c8c8c8">Unsubscribe from Pick ’Em reminders</a>.</p></td></tr></table></td></tr></table></body></html>`;
  const text = `VARSITYVUE PICK ’EM\n\nYour contest entry is not yet accepted.\n\n${entryMessage} The entry deadline is ${lockLabel}.\n\nComplete My Entry: ${pickemUrl}\n\nManage preferences: ${preferenceUrl}\nUnsubscribe from Pick ’Em reminders: ${unsubscribeUrl}`;
  return { subject, html, text, oneClickUrl };
}

async function persistFailure(
  delivery: ClaimedDelivery,
  workerSecret: string,
  detail: string,
  retryable: boolean,
) {
  const { data, error } = await workerClient().rpc("fail_product_email_delivery", {
    worker_secret: workerSecret,
    target_delivery_id: delivery.delivery_id,
    target_claim_token: delivery.claim_token,
    failure_detail: detail,
    retryable,
  });
  if (error) {
    console.error("Could not persist product-email failure.", {
      deliveryId: delivery.delivery_id,
      code: error.code,
    });
  }
  return data as string | null;
}

export async function deliverNextProductEmail() {
  const { workerSecret, resendApiKey } = configuration();
  if (!workerSecret || !resendApiKey || !process.env.PRODUCT_EMAIL_UNSUBSCRIBE_SECRET) {
    console.error("Product email worker is not configured.", {
      workerSecretConfigured: Boolean(workerSecret),
      resendConfigured: Boolean(resendApiKey),
      unsubscribeConfigured: Boolean(process.env.PRODUCT_EMAIL_UNSUBSCRIBE_SECRET),
    });
    return { outcome: "not_configured" as const };
  }

  const client = workerClient();
  const { data, error } = await client.rpc("claim_product_email_delivery_v2", {
    worker_secret: workerSecret,
  });
  if (error) {
    console.error("Could not claim a product-email delivery.", { code: error.code });
    return { outcome: "claim_failed" as const };
  }

  const delivery = (data?.[0] ?? null) as ClaimedDelivery | null;
  if (!delivery) return { outcome: "idle" as const };

  const rendered = renderProductEmail({
    category: delivery.category,
    userId: delivery.recipient_user_id,
    schoolSlugs: delivery.relevant_school_slugs,
    matchedSchoolSlugs: delivery.matched_school_slugs,
    snapshot: delivery.content_snapshot,
    testOnly: delivery.test_only,
  });

  let response: Response;
  try {
    response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `varsityvue-product/${delivery.delivery_id}`,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [delivery.recipient_email],
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        headers: {
          "List-Unsubscribe": `<${rendered.oneClickUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        tags: [
          { name: "system", value: "member-product-email" },
          { name: "category", value: delivery.category },
          { name: "test", value: delivery.test_only ? "true" : "false" },
        ],
      }),
    });
  } catch (failure) {
    const detail = failure instanceof Error ? failure.message : "Network failure";
    const status = await persistFailure(delivery, workerSecret, detail, true);
    return { outcome: "failed" as const, deliveryId: delivery.delivery_id, status };
  }

  const payload = (await response.json().catch(() => null)) as
    | { id?: string; message?: string; name?: string }
    | null;
  if (!response.ok || !payload?.id) {
    const detail = `Resend rejected product email (${response.status}): ${payload?.message ?? payload?.name ?? "unknown provider response"}`;
    const status = await persistFailure(
      delivery,
      workerSecret,
      detail,
      retryableStatus(response.status),
    );
    return { outcome: "failed" as const, deliveryId: delivery.delivery_id, status };
  }

  const { data: accepted, error: acceptanceError } = await client.rpc(
    "accept_product_email_delivery",
    {
      worker_secret: workerSecret,
      target_delivery_id: delivery.delivery_id,
      target_claim_token: delivery.claim_token,
      resend_message_id: payload.id,
    },
  );
  if (acceptanceError || accepted !== true) {
    console.error("Resend accepted a product email but its state was not persisted.", {
      deliveryId: delivery.delivery_id,
      providerMessageId: payload.id,
      code: acceptanceError?.code,
    });
    return { outcome: "acceptance_unrecorded" as const, deliveryId: delivery.delivery_id };
  }

  return {
    outcome: "provider_accepted" as const,
    deliveryId: delivery.delivery_id,
    providerMessageId: payload.id,
  };
}

export async function drainProductEmails(limit = 5) {
  const outcomes = [];
  for (let index = 0; index < limit; index += 1) {
    const outcome = await deliverNextProductEmail();
    outcomes.push(outcome);
    if (outcome.outcome !== "provider_accepted") break;
  }
  return outcomes;
}

export async function enqueuePickemEmailReminders() {
  const { workerSecret } = configuration();
  if (!workerSecret) return { outcome: "not_configured" as const };
  const { data, error } = await workerClient().rpc("enqueue_pickem_email_reminders", {
    worker_secret: workerSecret,
  });
  if (error) {
    console.error("Could not enqueue Pick 'Em reminders.", { code: error.code });
    return { outcome: "enqueue_failed" as const };
  }
  return { outcome: "enqueued" as const, count: Number(data ?? 0) };
}

export async function deliverNextPickemEmailReminder() {
  const { workerSecret, resendApiKey } = configuration();
  if (!workerSecret || !resendApiKey || !process.env.PRODUCT_EMAIL_UNSUBSCRIBE_SECRET) {
    return { outcome: "not_configured" as const };
  }

  const client = workerClient();
  const { data, error } = await client.rpc("claim_pickem_email_reminder", { worker_secret: workerSecret });
  if (error) {
    console.error("Could not claim a Pick 'Em reminder.", { code: error.code });
    return { outcome: "claim_failed" as const };
  }
  const delivery = (data?.[0] ?? null) as ClaimedPickemReminder | null;
  if (!delivery) return { outcome: "idle" as const };
  const rendered = renderPickemReminder(delivery);
  const { data: authorized, error: authorizationError } = await client.rpc(
    "authorize_pickem_email_reminder_send",
    { worker_secret: workerSecret, target_delivery_id: delivery.delivery_id, target_claim_token: delivery.claim_token },
  );
  if (authorizationError || authorized !== true) return { outcome: "suppressed" as const };
  // DB authorization can be delayed in transit. Fail closed against its frozen timestamp too.
  const deadline = Date.parse(delivery.lock_at);
  if (!Number.isFinite(deadline) || Date.now() >= deadline) return { outcome: "suppressed" as const };

  let response: Response;
  try {
    response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `varsityvue-pickem-reminder/${delivery.delivery_id}`,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [delivery.recipient_email],
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        headers: { "List-Unsubscribe": `<${rendered.oneClickUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
        tags: [{ name: "system", value: "pickem-reminder" }, { name: "week", value: String(delivery.week_number) }],
      }),
    });
  } catch (failure) {
    const detail = failure instanceof Error ? failure.message : "Network failure";
    await client.rpc("fail_pickem_email_reminder", {
      worker_secret: workerSecret,
      target_delivery_id: delivery.delivery_id,
      target_claim_token: delivery.claim_token,
      failure_detail: detail,
      retryable: true,
    });
    return { outcome: "failed" as const };
  }

  const payload = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;
  if (!response.ok || !payload?.id) {
    await client.rpc("fail_pickem_email_reminder", {
      worker_secret: workerSecret,
      target_delivery_id: delivery.delivery_id,
      target_claim_token: delivery.claim_token,
      failure_detail: `Resend rejected Pick 'Em reminder (${response.status}): ${payload?.message ?? "unknown response"}`,
      retryable: retryableStatus(response.status),
    });
    return { outcome: "failed" as const };
  }

  const { data: accepted, error: acceptanceError } = await client.rpc("accept_pickem_email_reminder", {
    worker_secret: workerSecret,
    target_delivery_id: delivery.delivery_id,
    target_claim_token: delivery.claim_token,
    resend_message_id: payload.id,
  });
  if (acceptanceError || accepted !== true) {
    console.error("Pick 'Em reminder acceptance could not be persisted.", { deliveryId: delivery.delivery_id, code: acceptanceError?.code });
    return { outcome: "acceptance_unrecorded" as const };
  }
  return { outcome: "provider_accepted" as const, deliveryId: delivery.delivery_id };
}

export async function drainPickemEmailReminders(limit = 3) {
  const outcomes = [];
  for (let index = 0; index < limit; index += 1) {
    const outcome = await deliverNextPickemEmailReminder();
    outcomes.push(outcome);
    if (outcome.outcome !== "provider_accepted") break;
  }
  return outcomes;
}

import "server-only";

import { createClient } from "@supabase/supabase-js";
import { renderProductEmail, type ProductEmailContentSnapshot } from "@/lib/product-email-renderer";
import type { ProductEmailCategory } from "@/lib/product-email-unsubscribe";
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

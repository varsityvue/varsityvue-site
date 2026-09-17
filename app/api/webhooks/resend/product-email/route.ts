import { createClient } from "@supabase/supabase-js";
import { Webhook } from "svix";

import { getSupabaseConfig } from "@/lib/supabase/config";

export const runtime = "nodejs";

type ResendWebhook = {
  type?: unknown;
  created_at?: unknown;
  data?: {
    email_id?: unknown;
    bounce?: { message?: unknown; type?: unknown; subType?: unknown };
    failed?: { reason?: unknown };
  };
};

const HANDLED_EVENTS = new Set([
  "email.sent",
  "email.delivered",
  "email.delivery_delayed",
  "email.bounced",
  "email.complained",
  "email.failed",
  "email.suppressed",
]);

function eventDetail(event: ResendWebhook) {
  const bounce = event.data?.bounce;
  if (bounce) {
    return [bounce.type, bounce.subType, bounce.message]
      .filter((value): value is string => typeof value === "string")
      .join(": ");
  }
  return typeof event.data?.failed?.reason === "string"
    ? event.data.failed.reason
    : null;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_PRODUCT_WEBHOOK_SECRET;
  const workerSecret = process.env.PRODUCT_EMAIL_WORKER_SECRET;
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");
  if (!webhookSecret || !workerSecret || !svixId || !svixTimestamp || !svixSignature) {
    return new Response("Invalid webhook", { status: 400 });
  }

  const rawBody = await request.text();
  let event: ResendWebhook;
  try {
    new Webhook(webhookSecret).verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
    event = JSON.parse(rawBody) as ResendWebhook;
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const type = typeof event.type === "string" ? event.type : "";
  if (!HANDLED_EVENTS.has(type)) return Response.json({ received: true });

  const providerMessageId = event.data?.email_id;
  if (typeof providerMessageId !== "string" || !providerMessageId) {
    return new Response("Invalid webhook payload", { status: 400 });
  }

  const { url, publishableKey } = getSupabaseConfig();
  const client = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.rpc("record_product_email_webhook", {
    worker_secret: workerSecret,
    webhook_id: svixId,
    webhook_event_type: type,
    resend_message_id: providerMessageId,
    provider_event_at:
      typeof event.created_at === "string" ? event.created_at : new Date().toISOString(),
    event_detail: eventDetail(event),
  });

  if (error) {
    console.error("Could not persist Resend product-email webhook.", { code: error.code });
    return new Response("Webhook processing failed", { status: 500 });
  }
  return Response.json({ received: true });
}

import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import {
  verifyProductEmailUnsubscribeToken,
  type UnsubscribeCategory,
} from "@/lib/product-email-unsubscribe";

function internalClient() {
  const { url, publishableKey } = getSupabaseConfig();
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function applyProductEmailUnsubscribe(token?: string | null) {
  const payload = verifyProductEmailUnsubscribeToken(token);
  const workerSecret = process.env.PRODUCT_EMAIL_WORKER_SECRET;
  if (!payload || !workerSecret) return { ok: false as const };

  const { error } = await internalClient().rpc("unsubscribe_member_product_email", {
    worker_secret: workerSecret,
    target_user_id: payload.userId,
    unsubscribe_category: payload.category,
  });
  if (error) {
    console.error("Could not persist product-email unsubscribe.", { code: error.code });
    return { ok: false as const };
  }
  return { ok: true as const, category: payload.category as UnsubscribeCategory };
}

import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export type ProductEmailCategory = "final_score" | "new_coverage" | "pickem_reminder";
export type UnsubscribeCategory = ProductEmailCategory | "all";

type UnsubscribePayload = {
  version: 1;
  userId: string;
  category: UnsubscribeCategory;
  issuedAt: number;
};

function unsubscribeSecret() {
  const secret = process.env.PRODUCT_EMAIL_UNSUBSCRIBE_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Product email unsubscribe signing is not configured.");
  }
  return `varsityvue-product-email-unsubscribe:v1:${secret}`;
}

function sign(encodedPayload: string) {
  return createHmac("sha256", unsubscribeSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createProductEmailUnsubscribeToken(
  userId: string,
  category: UnsubscribeCategory,
) {
  const payload: UnsubscribePayload = {
    version: 1,
    userId,
    category,
    issuedAt: Math.floor(Date.now() / 1000),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyProductEmailUnsubscribeToken(token?: string | null) {
  if (!token) return null;
  const [encodedPayload, providedSignature, extra] = token.split(".");
  if (!encodedPayload || !providedSignature || extra) return null;

  const expected = Buffer.from(sign(encodedPayload));
  const provided = Buffer.from(providedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<UnsubscribePayload>;
    const categories: UnsubscribeCategory[] = ["final_score", "new_coverage", "pickem_reminder", "all"];
    if (
      payload.version !== 1 ||
      typeof payload.userId !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(payload.userId) ||
      !categories.includes(payload.category as UnsubscribeCategory) ||
      typeof payload.issuedAt !== "number" ||
      payload.issuedAt > Math.floor(Date.now() / 1000) + 300
    ) {
      return null;
    }
    return payload as UnsubscribePayload;
  } catch {
    return null;
  }
}

export function productEmailCategoryLabel(category: UnsubscribeCategory) {
  if (category === "final_score") return "Final Score Email";
  if (category === "new_coverage") return "New Coverage Email";
  if (category === "pickem_reminder") return "Pick ’Em Reminder";
  return "all VarsityVue product email";
}

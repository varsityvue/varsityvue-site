import "server-only";

import {
  createProductEmailUnsubscribeToken,
  type ProductEmailCategory,
} from "@/lib/product-email-unsubscribe";

export type ProductEmailContentSnapshot = {
  headline?: unknown;
  body?: unknown;
  cta_path?: unknown;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function boundedString(value: unknown, fallback: string, maxLength: number) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, maxLength)
    : fallback;
}

function siteOrigin() {
  const configured = process.env.PRODUCT_EMAIL_SITE_ORIGIN?.trim();
  if (!configured) return "https://varsityvue.com";
  const url = new URL(configured);
  if (url.protocol !== "https:") throw new Error("Product email site origin must use HTTPS.");
  return url.origin;
}

function safeCtaUrl(value: unknown) {
  const path = boundedString(value, "/", 300);
  if (!path.startsWith("/") || path.startsWith("//") || /[\u0000-\u001f]/.test(path)) {
    return `${siteOrigin()}/`;
  }
  return new URL(path, siteOrigin()).toString();
}

export function renderProductEmail({
  category,
  userId,
  schoolSlugs,
  snapshot,
  testOnly,
}: {
  category: ProductEmailCategory;
  userId: string;
  schoolSlugs: string[];
  snapshot: ProductEmailContentSnapshot;
  testOnly: boolean;
}) {
  const categoryName = category === "final_score" ? "Final Score" : "New Coverage";
  const headline = boundedString(snapshot.headline, categoryName, 120);
  const body = boundedString(
    snapshot.body,
    category === "final_score"
      ? "A game involving a school you follow has reached a verified final."
      : "VarsityVue published new coverage involving a school you follow.",
    600,
  );
  const ctaUrl = safeCtaUrl(snapshot.cta_path);
  const unsubscribeToken = createProductEmailUnsubscribeToken(userId, category);
  const unsubscribeUrl = `${siteOrigin()}/email/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
  const oneClickUrl = `${siteOrigin()}/api/email/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
  const preferenceUrl = `${siteOrigin()}/account#email-preferences`;
  const followedReason = schoolSlugs.length === 1
    ? `you follow ${schoolSlugs[0].replaceAll("-", " ")}`
    : "you follow a school connected to this update";
  const testLabel = testOnly ? "Controlled delivery test · " : "";
  const subject = `${testOnly ? "[Test] " : ""}${headline}`;

  const html = `<!doctype html><html><body style="margin:0;background:#070707;color:#f7f7f7;font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(body)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#070707"><tr><td align="center" style="padding:28px 14px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;border:1px solid #2b2b2b;border-radius:18px;background:#111111"><tr><td style="padding:28px"><p style="margin:0 0 18px;color:#f2b84b;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase">VarsityVue</p><p style="margin:0 0 8px;color:#a6a6a6;font-size:12px;font-weight:700;text-transform:uppercase">${escapeHtml(testLabel + categoryName)}</p><h1 style="margin:0;color:#ffffff;font-size:28px;line-height:1.2">${escapeHtml(headline)}</h1><p style="margin:18px 0 0;color:#d1d1d1;font-size:16px;line-height:1.6">${escapeHtml(body)}</p><p style="margin:24px 0"><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;border-radius:999px;background:#7a1022;color:#ffffff;padding:13px 20px;text-decoration:none;font-size:14px;font-weight:800">View on VarsityVue</a></p><p style="margin:24px 0 0;border-top:1px solid #2b2b2b;padding-top:18px;color:#858585;font-size:12px;line-height:1.6">You received this ${categoryName.toLowerCase()} email because ${escapeHtml(followedReason)} and enabled this category. <a href="${escapeHtml(preferenceUrl)}" style="color:#c8c8c8">Manage preferences</a> or <a href="${escapeHtml(unsubscribeUrl)}" style="color:#c8c8c8">unsubscribe from ${escapeHtml(categoryName)}</a>.</p></td></tr></table></td></tr></table></body></html>`;

  const text = `${testOnly ? "CONTROLLED DELIVERY TEST\n\n" : ""}${headline}\n\n${body}\n\nView on VarsityVue: ${ctaUrl}\n\nYou received this ${categoryName.toLowerCase()} email because ${followedReason} and enabled this category.\nManage preferences: ${preferenceUrl}\nUnsubscribe from ${categoryName}: ${unsubscribeUrl}`;

  return {
    subject,
    html,
    text,
    unsubscribeUrl,
    oneClickUrl,
  };
}

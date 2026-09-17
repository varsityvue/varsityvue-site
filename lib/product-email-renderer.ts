import "server-only";

import {
  createProductEmailUnsubscribeToken,
  type ProductEmailCategory,
} from "@/lib/product-email-unsubscribe";

export type ProductEmailContentSnapshot = {
  headline?: unknown;
  body?: unknown;
  cta_path?: unknown;
  kind?: unknown;
  game_id?: unknown;
  away_team_name?: unknown;
  home_team_name?: unknown;
  away_school_slug?: unknown;
  home_school_slug?: unknown;
  away_score?: unknown;
  home_score?: unknown;
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

function boundedScore(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 999
    ? value
    : null;
}

function isVerifiedFinalSnapshot(snapshot: ProductEmailContentSnapshot) {
  return snapshot.kind === "verified_final"
    && typeof snapshot.game_id === "string"
    && boundedScore(snapshot.away_score) !== null
    && boundedScore(snapshot.home_score) !== null;
}

function finalScoreReason({
  snapshot,
  matchedSchoolSlugs,
}: {
  snapshot: ProductEmailContentSnapshot;
  matchedSchoolSlugs: string[];
}) {
  if (matchedSchoolSlugs.length !== 1) {
    return "you follow these programs";
  }

  const followedSlug = matchedSchoolSlugs[0];
  if (followedSlug === snapshot.away_school_slug) {
    return `you follow ${boundedString(snapshot.away_team_name, "the away team", 120)}`;
  }
  if (followedSlug === snapshot.home_school_slug) {
    return `you follow ${boundedString(snapshot.home_team_name, "the home team", 120)}`;
  }
  return "you follow a program in this game";
}

export function renderProductEmail({
  category,
  userId,
  schoolSlugs,
  matchedSchoolSlugs = schoolSlugs,
  snapshot,
  testOnly,
}: {
  category: ProductEmailCategory;
  userId: string;
  schoolSlugs: string[];
  matchedSchoolSlugs?: string[];
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
  const followedReason = matchedSchoolSlugs.length === 1
    ? `you follow ${matchedSchoolSlugs[0].replaceAll("-", " ")}`
    : "you follow a school connected to this update";
  const testLabel = testOnly ? "Controlled delivery test · " : "";
  const subject = `${testOnly ? "[Test] " : ""}${headline}`;

  if (category === "final_score" && !testOnly && isVerifiedFinalSnapshot(snapshot)) {
    const awayName = boundedString(snapshot.away_team_name, "Away Team", 120);
    const homeName = boundedString(snapshot.home_team_name, "Home Team", 120);
    const awayScore = boundedScore(snapshot.away_score) as number;
    const homeScore = boundedScore(snapshot.home_score) as number;
    const reason = finalScoreReason({ snapshot, matchedSchoolSlugs });
    const finalSubject = `FINAL: ${awayName} ${awayScore}, ${homeName} ${homeScore}`;
    const preheader = `${awayName} ${awayScore}, ${homeName} ${homeScore} — verified final.`;
    const why = `You received this Final Score email because ${reason} and enabled Final Score Email.`;
    const scoreRows = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;border:1px solid #2b2b2b;border-radius:14px;background:#090909"><tr><td style="padding:16px 18px;color:#ffffff;font-size:17px;font-weight:800">${escapeHtml(awayName)}</td><td align="right" style="padding:16px 18px;color:#ffffff;font-size:24px;font-weight:900">${awayScore}</td></tr><tr><td style="border-top:1px solid #242424;padding:16px 18px;color:#ffffff;font-size:17px;font-weight:800">${escapeHtml(homeName)}</td><td align="right" style="border-top:1px solid #242424;padding:16px 18px;color:#ffffff;font-size:24px;font-weight:900">${homeScore}</td></tr></table>`;
    const html = `<!doctype html><html><body style="margin:0;background:#070707;color:#f7f7f7;font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#070707"><tr><td align="center" style="padding:28px 14px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;border:1px solid #2b2b2b;border-radius:18px;background:#111111"><tr><td style="padding:28px"><p style="margin:0 0 18px;color:#f2b84b;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase">VarsityVue</p><p style="margin:0;color:#a6a6a6;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase">Final</p>${scoreRows}<p style="margin:24px 0"><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;border-radius:999px;background:#7a1022;color:#ffffff;padding:13px 20px;text-decoration:none;font-size:14px;font-weight:800">View Game</a></p><p style="margin:24px 0 0;border-top:1px solid #2b2b2b;padding-top:18px;color:#858585;font-size:12px;line-height:1.6">${escapeHtml(why)} <a href="${escapeHtml(preferenceUrl)}" style="color:#c8c8c8">Manage preferences</a> · <a href="${escapeHtml(unsubscribeUrl)}" style="color:#c8c8c8">Unsubscribe from Final Score</a>.</p></td></tr></table></td></tr></table></body></html>`;
    const text = `VARSITYVUE\n\nFINAL\n\n${awayName}  ${awayScore}\n${homeName}  ${homeScore}\n\nView Game: ${ctaUrl}\n\n${why}\nManage preferences: ${preferenceUrl}\nUnsubscribe from Final Score: ${unsubscribeUrl}`;

    return {
      subject: finalSubject,
      html,
      text,
      unsubscribeUrl,
      oneClickUrl,
    };
  }

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

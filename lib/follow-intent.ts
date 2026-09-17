import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import {
  createFollowContext,
  followReturnPath,
  type FollowContext,
  type FollowSourceSurface,
} from "@/lib/follow-context";

export const FOLLOW_INTENT_COOKIE = "vv_follow_intent";
export const FOLLOW_INTENT_MAX_AGE_SECONDS = 30 * 60;

type FollowIntentPayload = {
  version: 1 | 2;
  schoolSlug: string;
  returnTo: string;
  sourceSurface: FollowSourceSurface;
  sourceId?: string;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
};

function signingSecret(override?: string) {
  const secret =
    override ??
    process.env.FOLLOW_INTENT_SECRET ??
    process.env.MEMBER_NOTIFICATION_WORKER_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("Follow intent signing secret is not configured.");
  }

  return `varsityvue-follow-intent:v1:${secret}`;
}

function signature(encodedPayload: string, secret?: string) {
  return createHmac("sha256", signingSecret(secret))
    .update(encodedPayload)
    .digest("base64url");
}

export function createFollowIntent(
  schoolSlug: string,
  context: FollowContext = { sourceSurface: "school_hub" },
  now = Date.now(),
  secret?: string,
) {
  const issuedAt = Math.floor(now / 1000);
  const payload: FollowIntentPayload = {
    version: 2,
    schoolSlug,
    returnTo: followReturnPath(context, schoolSlug),
    sourceSurface: context.sourceSurface,
    ...(context.sourceSurface === "school_hub" ? {} : { sourceId: context.sourceId }),
    issuedAt,
    expiresAt: issuedAt + FOLLOW_INTENT_MAX_AGE_SECONDS,
    nonce: randomUUID(),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${signature(encodedPayload, secret)}`;
}

export function verifyFollowIntent(
  token: string | undefined,
  now = Date.now(),
  secret?: string,
): FollowIntentPayload | null {
  if (!token) return null;
  const [encodedPayload, providedSignature, extra] = token.split(".");
  if (!encodedPayload || !providedSignature || extra) return null;

  const expectedSignature = signature(encodedPayload, secret);
  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<FollowIntentPayload>;
    const currentTime = Math.floor(now / 1000);
    const context = createFollowContext(
      payload.sourceSurface as FollowSourceSurface,
      payload.sourceId,
    );
    const validLegacyIntent =
      payload.version === 1 &&
      payload.sourceSurface === "school_hub" &&
      payload.sourceId === undefined;
    const validCurrentIntent = payload.version === 2 && Boolean(context);
    if (
      (!validLegacyIntent && !validCurrentIntent) ||
      typeof payload.schoolSlug !== "string" ||
      !context ||
      payload.returnTo !== followReturnPath(context, payload.schoolSlug) ||
      typeof payload.issuedAt !== "number" ||
      typeof payload.expiresAt !== "number" ||
      typeof payload.nonce !== "string" ||
      payload.issuedAt > currentTime + 60 ||
      payload.expiresAt <= currentTime ||
      payload.expiresAt - payload.issuedAt !== FOLLOW_INTENT_MAX_AGE_SECONDS
    ) {
      return null;
    }
    return payload as FollowIntentPayload;
  } catch {
    return null;
  }
}

export function contextualFollowCompletionPath(
  schoolSlug: string,
  context: FollowContext,
) {
  const params = new URLSearchParams({
    school: schoolSlug,
    surface: context.sourceSurface,
  });
  if (context.sourceSurface !== "school_hub") params.set("source", context.sourceId);
  return `/follow/complete?${params.toString()}`;
}

export function followIntentCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: FOLLOW_INTENT_MAX_AGE_SECONDS,
  };
}

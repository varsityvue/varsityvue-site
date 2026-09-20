export const ATTRIBUTION_COOKIE = "vv_attribution";

export type CampaignAttribution = {
  source: string;
  campaign: string;
  landing: string;
};

const TOKEN = /^[a-z0-9][a-z0-9_-]{0,79}$/;

export function normalizedAttribution(input: Partial<CampaignAttribution>): CampaignAttribution | null {
  const source = input.source?.trim().toLowerCase() ?? "";
  const campaign = input.campaign?.trim().toLowerCase() ?? "";
  const landing = input.landing?.trim().slice(0, 200) ?? "";
  if (!TOKEN.test(source) || !TOKEN.test(campaign) || !landing.startsWith("/") || landing.startsWith("//")) return null;
  return { source, campaign, landing };
}

export function serializeAttribution(attribution: CampaignAttribution) {
  return JSON.stringify(attribution);
}

export function parseAttribution(value?: string | null) {
  if (!value) return null;
  try {
    return normalizedAttribution(JSON.parse(value) as Partial<CampaignAttribution>);
  } catch {
    return null;
  }
}

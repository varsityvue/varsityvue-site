import "server-only";

import { track } from "@vercel/analytics/server";
import { after } from "next/server";

type ConversionProperty = string | number | boolean | null | undefined;

export function trackConversion(
  eventName: string,
  properties: Record<string, ConversionProperty> = {},
) {
  const safeProperties = Object.fromEntries(
    Object.entries(properties).filter(([, property]) => property !== undefined),
  );

  after(async () => {
    console.log(JSON.stringify({
      level: "info",
      message: "conversion_event",
      event: eventName,
      properties: safeProperties,
    }));

    try {
      await track(eventName, safeProperties);
    } catch (error) {
      console.warn(JSON.stringify({
        level: "warn",
        message: "conversion_event_delivery_failed",
        event: eventName,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  });
}

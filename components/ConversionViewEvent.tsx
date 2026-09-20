"use client";

import { track } from "@vercel/analytics";
import { useEffect, useRef } from "react";

type ConversionProperty = string | number | boolean | null | undefined;

export default function ConversionViewEvent({
  name,
  properties,
}: {
  name: string;
  properties?: Record<string, ConversionProperty>;
}) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    track(name, properties);
  }, [name, properties]);

  return null;
}

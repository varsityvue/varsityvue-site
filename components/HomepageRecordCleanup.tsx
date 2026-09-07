"use client";

import { useEffect } from "react";

function cleanEmptyDistrictRecords() {
  const recordLines = document.querySelectorAll<HTMLElement>("main [data-side] > p");

  recordLines.forEach((line) => {
    const text = line.textContent?.trim();
    if (!text || !text.includes("Overall") || !text.includes("District")) return;

    if (text.endsWith("District —")) {
      line.textContent = text.replace(/\s*·\s*District\s+—$/, "");
    }
  });
}

export default function HomepageRecordCleanup() {
  useEffect(() => {
    cleanEmptyDistrictRecords();

    const observer = new MutationObserver(cleanEmptyDistrictRecords);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}

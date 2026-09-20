"use client";

import { useState } from "react";

type ArticleShareProps = {
  title: string;
  url: string;
};

export default function ArticleShare({ title, url }: ArticleShareProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const trackedUrl = new URL(url);
    trackedUrl.searchParams.set("utm_source", "member_share");
    trackedUrl.searchParams.set("utm_medium", "social");
    trackedUrl.searchParams.set("utm_campaign", `coverage-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70)}`);
    const shareUrl = trackedUrl.toString();
    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareUrl)}`;
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/12 bg-white/[0.055] px-4 text-[11px] font-black uppercase tracking-[0.14em] text-white/65 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
      aria-label={`Share ${title}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <circle cx="18" cy="5" r="2.5" />
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="19" r="2.5" />
        <path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5" />
      </svg>
      {copied ? "Link Copied" : "Share Story"}
    </button>
  );
}

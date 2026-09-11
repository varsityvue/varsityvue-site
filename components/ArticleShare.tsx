"use client";

import { useState } from "react";

type ArticleShareProps = {
  title: string;
  url: string;
};

export default function ArticleShare({ title, url }: ArticleShareProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`;
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/12 bg-white/[0.055] px-4 text-[11px] font-black uppercase tracking-[0.14em] text-white/65 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
      aria-label={`Share ${title}`}
    >
      <span aria-hidden="true">↗</span>
      {copied ? "Link Copied" : "Share Story"}
    </button>
  );
}

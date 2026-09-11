"use client";

import { useState } from "react";

type ArticleShareProps = {
  title: string;
  url: string;
};

export default function ArticleShare({ title, url }: ArticleShareProps) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const textBody = encodeURIComponent(`${title} ${url}`);

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
      window.location.href = url;
    }
  }

  const buttonClass =
    "inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-4 text-xs font-black uppercase tracking-[0.12em] text-white/70 transition hover:border-white/20 hover:bg-white/10 hover:text-white";

  return (
    <div className="mt-5 border-t border-white/10 pt-5">
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
        Share this story
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleShare} className={buttonClass}>
          {copied ? "Link Copied" : "Share"}
        </button>
        <a href={`sms:?&body=${textBody}`} className={buttonClass}>
          Text
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
          className={buttonClass}
        >
          Facebook
        </a>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
          className={buttonClass}
        >
          X
        </a>
      </div>
    </div>
  );
}

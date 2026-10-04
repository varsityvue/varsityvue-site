"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

export default function ShareAction({ title, text, url, className = "" }: {
  title: string; text: string; url: string; className?: string;
}) {
  const [message, setMessage] = useState("");
  async function share() {
    setMessage("");
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setMessage("Link copied");
    } catch {
      window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n${url}`)}`;
    }
  }
  return <span className={className}>
    <button type="button" onClick={() => void share()} aria-label={`Share ${title}`} title={`Share ${title}`} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/25 text-white/65 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
      <Share2 aria-hidden="true" size={18} />
    </button>
    <span role="status" className={message ? "fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-white/20 bg-neutral-900 px-4 py-2 text-sm text-white" : "sr-only"}>{message}</span>
  </span>;
}

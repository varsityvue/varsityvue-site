"use client";

import { useEffect, useRef, useState } from "react";
import { Share2 } from "lucide-react";

export default function ShareAction({ title, text, url, className = "", label }: {
  title: string; text: string; url: string; className?: string; label?: string;
}) {
  const [feedback, setFeedback] = useState<{key: string} | null>(null);
  const contentKey = JSON.stringify([title, text, url]);
  const [pending, setPending] = useState(false);
  const sharing = useRef(false);
  const mounted = useRef(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackVersion = useRef(0);
  const [previousContent, setPreviousContent] = useState(contentKey);
  if (previousContent !== contentKey) {
    setPreviousContent(contentKey);
    setFeedback(null);
  }
  const message = feedback?.key === contentKey ? "Link copied" : "";
  useEffect(() => () => {
    feedbackVersion.current++;
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = null;
  }, [contentKey]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);
  function clearFeedback() {
    feedbackVersion.current++;
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = null;
    setFeedback(null);
  }
  async function share() {
    // The ref closes the same-render gap before native sharing or any await.
    if (sharing.current) return;
    sharing.current = true;
    setPending(true);
    clearFeedback();
    const attemptVersion = feedbackVersion.current;
    try {
      if (navigator.share) {
        try {
          await navigator.share({ title, text, url });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        }
      }
      if (!mounted.current || attemptVersion !== feedbackVersion.current) return;
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        if (mounted.current && attemptVersion === feedbackVersion.current) {
          const version = ++feedbackVersion.current;
          setFeedback({key: contentKey});
          feedbackTimer.current = setTimeout(() => {
            if (mounted.current && version === feedbackVersion.current) {
              setFeedback(null);
              feedbackTimer.current = null;
            }
          }, 4000);
        }
      } catch {
        if (mounted.current && attemptVersion === feedbackVersion.current) window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n${url}`)}`;
      }
    } finally {
      sharing.current = false;
      if (mounted.current) setPending(false);
    }
  }
  return <span className={`inline-flex ${label ? "w-auto" : "w-[2.75rem]"} min-w-11 flex-col items-center ${className}`}>
    <button type="button" onClick={() => void share()} disabled={pending} aria-label={`Share ${title}`} title={`Share ${title}`} className={`inline-flex h-11 min-h-11 ${label ? "gap-2 px-3" : "w-11"} min-w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/25 text-white/65 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60`}>
      <Share2 aria-hidden="true" size={18} />
      {label ? <span className="whitespace-nowrap text-xs font-bold">{label}</span> : null}
    </button>
    <span role="status" aria-atomic="true" className={message ? "mt-1 w-full break-words text-center text-xs leading-normal text-white" : "sr-only"}>{message}</span>
  </span>;
}

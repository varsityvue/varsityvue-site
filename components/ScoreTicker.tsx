"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** The server sends one meaningful sequence; the browser adds only a visual copy. */
export default function ScoreTicker({ children }: { children: ReactNode }) {
  const sequenceRef = useRef<HTMLDivElement>(null);
  const decorationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sequence = sequenceRef.current;
    const decoration = decorationRef.current;
    if (!sequence || !decoration) return;
    const clone = sequence.cloneNode(true) as HTMLDivElement;
    // Decorative copies must never expose link targets or focusable controls.
    clone.querySelectorAll("a").forEach((link) => {
      const visual = document.createElement("span");
      visual.className = link.className;
      visual.append(...Array.from(link.childNodes));
      link.replaceWith(visual);
    });
    decoration.replaceChildren(...Array.from(clone.childNodes));
    decoration.parentElement?.setAttribute("data-loop-ready", "true");
    return () => {
      decoration.replaceChildren();
      decoration.parentElement?.removeAttribute("data-loop-ready");
    };
  }, [children]);

  return (
    <div
      className="vv-score-ticker-wrap min-w-0 flex-1 overflow-x-auto"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.scrollLeft = 0;
      }}
    >
      <style>{`
        @keyframes vv-score-ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .vv-score-ticker-track { width: max-content; }
        .vv-score-ticker-track[data-loop-ready] {
          animation: vv-score-ticker 38s linear infinite;
        }
        .vv-score-ticker-wrap:has([data-loop-ready]):not(:focus-within) {
          overflow-x: hidden;
        }
        .vv-score-ticker-wrap:hover .vv-score-ticker-track {
          animation-play-state: paused;
        }
        .vv-score-ticker-wrap:focus-within .vv-score-ticker-track {
          animation: none;
          transform: none;
        }
        .vv-score-ticker-wrap:focus-within .vv-score-ticker-decoration {
          display: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .vv-score-ticker-track[data-loop-ready] { animation: none; }
          .vv-score-ticker-decoration { display: none; }
          .vv-score-ticker-wrap:has([data-loop-ready]) { overflow-x: auto; }
        }
      `}</style>
      <div className="vv-score-ticker-track flex h-full items-center">
        <div ref={sequenceRef} className="flex h-full shrink-0 items-center">{children}</div>
        <div ref={decorationRef} aria-hidden="true" inert className="vv-score-ticker-decoration flex h-full shrink-0 items-center" />
      </div>
    </div>
  );
}

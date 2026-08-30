"use client";

import { useMemo, useRef, useState } from "react";

import type { GameStats } from "@/data/game-stats";
import {
  formatGameStatsForDataFile,
  parseGameStatsDraft,
  resolveKnownPlayerIds,
} from "@/lib/game-stats-import";
import { validateGameStats } from "@/lib/game-stats-validation";

const starter = `{
  "gameId": "",
  "season": 2026,
  "sourceStatus": "verified",
  "sourceLabel": "Statistics provided by the coaching staff",
  "quarterScores": [],
  "scoringPlays": [],
  "teamStats": [],
  "rushing": [],
  "passing": [],
  "receiving": []
}`;

export default function GameStatsReviewTool() {
  const [raw, setRaw] = useState(starter);
  const [resolved, setResolved] = useState<GameStats | null>(null);
  const [notices, setNotices] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parseGameStatsDraft(raw), [raw]);
  const stats = resolved ?? (parsed.ok ? parsed.stats : null);
  const issues = useMemo(() => (stats ? validateGameStats(stats) : []), [stats]);
  const errors = issues.filter((issue) => issue.level === "error");
  const warnings = issues.filter((issue) => issue.level === "warning");

  function resolvePlayers() {
    if (!parsed.ok) return;
    const result = resolveKnownPlayerIds(parsed.stats);
    setResolved(result.stats);
    setNotices(result.notices);
  }

  function resetResolved() {
    setResolved(null);
    setNotices([]);
  }

  function loadFile(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setRaw(reader.result);
        setResolved(null);
        setNotices([]);
      }
    };
    reader.readAsText(file);
  }

  async function copyApprovedJson() {
    if (!stats || errors.length > 0) return;
    await navigator.clipboard.writeText(formatGameStatsForDataFile(stats));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">Import Draft</p>
            <h2 className="mt-2 text-2xl font-black">Paste or upload JSON</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">
              This tool reviews one structured GameStats object at a time. It does not publish directly to production.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json,text/plain"
              className="hidden"
              onChange={(event) => loadFile(event.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Upload JSON
            </button>
          </div>
        </div>

        <textarea
          value={raw}
          onChange={(event) => {
            setRaw(event.target.value);
            resetResolved();
          }}
          spellCheck={false}
          className="mt-5 min-h-[620px] w-full resize-y rounded-2xl border border-white/10 bg-black/45 p-4 font-mono text-xs leading-6 text-white/75 outline-none focus:border-white/25"
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!parsed.ok}
            onClick={resolvePlayers}
            className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition disabled:cursor-not-allowed disabled:opacity-35"
          >
            Resolve Player IDs
          </button>
          {resolved && (
            <button
              type="button"
              onClick={resetResolved}
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/60"
            >
              Use Original Draft
            </button>
          )}
        </div>
      </section>

      <div className="space-y-6">
        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">Review Status</p>
          {!parsed.ok ? (
            <div className="mt-5 space-y-2">
              {parsed.errors.map((error) => (
                <Issue key={error} level="error" message={error} />
              ))}
            </div>
          ) : (
            <>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <StatusCard label="Errors" value={errors.length} />
                <StatusCard label="Warnings" value={warnings.length} />
                <StatusCard label="Player Matches" value={notices.length} />
              </div>

              <div className="mt-5 space-y-2">
                {issues.length === 0 && (
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                    No validation issues found.
                  </div>
                )}
                {issues.map((issue, index) => (
                  <Issue key={`${issue.level}-${index}-${issue.message}`} {...issue} />
                ))}
              </div>
            </>
          )}
        </section>

        {stats && (
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">Game Preview</p>
                <h2 className="mt-2 text-2xl font-black">{stats.gameId || "Unassigned game"}</h2>
                <p className="mt-2 text-sm text-white/45">Season {stats.season} · {stats.sourceLabel}</p>
              </div>
              <span className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] ${errors.length ? "border-red-400/20 bg-red-400/10 text-red-100" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"}`}>
                {errors.length ? "Blocked" : "Ready for review"}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <PreviewCard label="Quarter score lines" value={stats.quarterScores.length} />
              <PreviewCard label="Scoring plays" value={stats.scoringPlays.length} />
              <PreviewCard label="Team stat lines" value={stats.teamStats.length} />
              <PreviewCard label="Rushing lines" value={stats.rushing.length} />
              <PreviewCard label="Passing lines" value={stats.passing.length} />
              <PreviewCard label="Receiving lines" value={stats.receiving.length} />
            </div>
          </section>
        )}

        {notices.length > 0 && (
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">Player Identity Review</p>
            <div className="mt-4 space-y-2">
              {notices.map((notice) => (
                <div key={notice} className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs leading-5 text-white/55">
                  {notice}
                </div>
              ))}
            </div>
          </section>
        )}

        {stats && (
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">Approval Output</p>
            <h2 className="mt-2 text-2xl font-black">Production-ready object</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">
              Copy this only after reviewing every warning and confirming the source. Publishing still requires adding the approved object to data/game-stats.ts.
            </p>
            <pre className="mt-5 max-h-[440px] overflow-auto rounded-2xl border border-white/10 bg-black/45 p-4 text-xs leading-6 text-white/65">
              {formatGameStatsForDataFile(stats)}
            </pre>
            <button
              type="button"
              disabled={errors.length > 0}
              onClick={copyApprovedJson}
              className="mt-4 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition disabled:cursor-not-allowed disabled:opacity-35"
            >
              Copy Approved JSON
            </button>
          </section>
        )}
      </div>
    </div>
  );
}

function StatusCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function PreviewCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function Issue({ level, message }: { level: "error" | "warning"; message: string }) {
  return (
    <div className={`rounded-xl border p-4 text-sm leading-6 ${level === "error" ? "border-red-400/20 bg-red-400/10 text-red-100" : "border-amber-300/20 bg-amber-300/10 text-amber-50"}`}>
      <span className="mr-2 font-black uppercase tracking-[0.1em]">{level}</span>
      {message}
    </div>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";

import type { GameStats } from "@/data/game-stats";
import { getGameStatsCsvTemplate, parseGameStatsCsv } from "@/lib/game-stats-csv";
import {
  formatGameStatsForDataFile,
  parseGameStatsDraft,
  resolveKnownPlayerIds,
} from "@/lib/game-stats-import";
import { validateGameStats } from "@/lib/game-stats-validation";
import { createStatCorrectionAudit, formatStatCorrectionAudit } from "@/lib/stat-corrections";

type CanonicalGame = {
  id: string;
  season: number;
  week?: number;
  homeSchoolSlug?: string;
  awaySchoolSlug?: string;
  homeTeam?: string;
  awayTeam?: string;
  date?: string;
  kickoff?: string;
  status: string;
  homeScore?: number;
  awayScore?: number;
  hasStats?: boolean;
};

type ReviewMode = "new" | "replace";

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

export default function GameStatsReviewTool({
  canonicalGames,
  existingStats,
}: {
  canonicalGames: CanonicalGame[];
  existingStats: GameStats[];
}) {
  const [mode, setMode] = useState<ReviewMode>("new");
  const [raw, setRaw] = useState(starter);
  const [resolved, setResolved] = useState<GameStats | null>(null);
  const [notices, setNotices] = useState<string[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [confirmedGameId, setConfirmedGameId] = useState("");
  const [replacementTargetId, setReplacementTargetId] = useState("");
  const [reviewedBy, setReviewedBy] = useState("");
  const [promptedBy, setPromptedBy] = useState("");
  const [correctionNote, setCorrectionNote] = useState("");
  const [auditRecordedAt, setAuditRecordedAt] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parseGameStatsDraft(raw), [raw]);
  const stats = resolved ?? (parsed.ok ? parsed.stats : null);
  const originalStats = useMemo(
    () => existingStats.find((entry) => entry.gameId === replacementTargetId),
    [existingStats, replacementTargetId]
  );
  const issues = useMemo(() => (stats ? validateGameStats(stats) : []), [stats]);
  const errors = issues.filter((issue) => issue.level === "error");
  const warnings = issues.filter((issue) => issue.level === "warning");

  const statSchoolSlugs = useMemo(() => {
    if (!stats) return [];
    return Array.from(new Set([
      ...stats.quarterScores.map((line) => line.schoolSlug),
      ...stats.teamStats.map((line) => line.schoolSlug),
      ...stats.rushing.map((line) => line.schoolSlug),
      ...stats.passing.map((line) => line.schoolSlug),
      ...stats.receiving.map((line) => line.schoolSlug),
    ])).filter(Boolean);
  }, [stats]);

  const suggestedGames = useMemo(() => {
    if (!stats) return [];
    return canonicalGames
      .filter((game) => game.season === stats.season)
      .map((game) => {
        const teams = [game.homeSchoolSlug, game.awaySchoolSlug].filter(Boolean) as string[];
        const overlap = statSchoolSlugs.filter((slug) => teams.includes(slug)).length;
        const exactId = stats.gameId === game.id ? 10 : 0;
        return { game, score: exactId + overlap };
      })
      .filter((entry) => entry.score > 0 || statSchoolSlugs.length === 0)
      .sort((a, b) => b.score - a.score || (a.game.week ?? 99) - (b.game.week ?? 99))
      .slice(0, 20)
      .map((entry) => entry.game);
  }, [canonicalGames, statSchoolSlugs, stats]);

  const selectedGame = canonicalGames.find((game) => game.id === selectedGameId);
  const confirmedGame = canonicalGames.find((game) => game.id === confirmedGameId);
  const canonicalProblems = useMemo(() => getCanonicalProblems(stats, confirmedGame), [stats, confirmedGame]);
  const duplicateProblem = confirmedGame?.hasStats && !(mode === "replace" && confirmedGame.id === replacementTargetId)
    ? `This game already has a verified GameStats record (${confirmedGame.id}). Use correction mode to intentionally replace it.`
    : undefined;
  const replacementProblem = mode === "replace" && confirmedGame && confirmedGame.id !== replacementTargetId
    ? `Correction mode is locked to ${replacementTargetId}. Confirm that same canonical game before approval.`
    : undefined;
  const unchangedProblem = mode === "replace" && originalStats && stats && sameStats(originalStats, stats)
    ? "No changes have been made to the existing GameStats record."
    : undefined;

  const changeSummary = useMemo(
    () => (mode === "replace" && originalStats && stats ? getChangeSummary(originalStats, stats) : []),
    [mode, originalStats, stats]
  );

  const auditMissing = mode === "replace" && (!reviewedBy.trim() || !promptedBy.trim() || !correctionNote.trim());
  const auditNotFinalized = mode === "replace" && !auditRecordedAt;
  const correctionAudit = useMemo(() => {
    if (mode !== "replace" || !stats || !auditRecordedAt || auditMissing || changeSummary.length === 0) return null;
    return createStatCorrectionAudit({
      gameId: stats.gameId,
      season: stats.season,
      reviewedAt: auditRecordedAt,
      reviewedBy,
      promptedBy,
      note: correctionNote,
      changedSections: changeSummary,
    });
  }, [mode, stats, auditRecordedAt, auditMissing, changeSummary, reviewedBy, promptedBy, correctionNote]);

  const approvalBlocked =
    errors.length > 0 ||
    !confirmedGame ||
    canonicalProblems.length > 0 ||
    Boolean(duplicateProblem) ||
    Boolean(replacementProblem) ||
    Boolean(unchangedProblem) ||
    auditMissing ||
    auditNotFinalized;

  function invalidateAudit() {
    if (mode === "replace") setAuditRecordedAt("");
  }

  function clearReviewState() {
    setResolved(null);
    setNotices([]);
    setFileErrors([]);
    setSelectedGameId("");
    setConfirmedGameId("");
    setAuditRecordedAt("");
  }

  function startNewImport() {
    setMode("new");
    setReplacementTargetId("");
    setReviewedBy("");
    setPromptedBy("");
    setCorrectionNote("");
    setRaw(starter);
    clearReviewState();
  }

  function loadExistingRecord(gameId: string) {
    const existing = existingStats.find((entry) => entry.gameId === gameId);
    if (!existing) return;
    setMode("replace");
    setReplacementTargetId(gameId);
    setReviewedBy("");
    setPromptedBy("");
    setCorrectionNote("");
    setAuditRecordedAt("");
    setRaw(formatGameStatsForDataFile(existing));
    setResolved(existing);
    setSelectedGameId(gameId);
    setConfirmedGameId(gameId);
    setFileErrors([]);
    setNotices([`Loaded existing verified GameStats record ${gameId} for correction review.`]);
  }

  function resolvePlayers() {
    if (!stats) return;
    invalidateAudit();
    const result = resolveKnownPlayerIds(stats);
    setResolved(result.stats);
    setNotices((current) => [...current, ...result.notices]);
  }

  function confirmCanonicalGame() {
    if (!stats || !selectedGame) return;
    invalidateAudit();
    const next = { ...stats, gameId: selectedGame.id, season: selectedGame.season };
    setResolved(next);
    setConfirmedGameId(selectedGame.id);
    setNotices((current) => [...current, `Confirmed canonical game ${formatGameLabel(selectedGame)}.`]);
  }

  function loadFile(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      clearReviewState();
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith(".csv") || file.type === "text/csv") {
        const csv = parseGameStatsCsv(reader.result);
        if (!csv.ok) {
          setFileErrors(csv.errors);
          return;
        }
        setRaw(formatGameStatsForDataFile(csv.stats));
        setNotices(csv.notices);
        return;
      }
      setRaw(reader.result);
    };
    reader.readAsText(file);
  }

  function downloadCsvTemplate() {
    const blob = new Blob([getGameStatsCsvTemplate()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "varsityvue-game-stats-template.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function finalizeCorrectionAudit() {
    if (mode !== "replace" || auditMissing || changeSummary.length === 0) return;
    setAuditRecordedAt(new Date().toISOString());
  }

  async function copyApprovedJson() {
    if (!stats || approvalBlocked) return;
    await navigator.clipboard.writeText(formatGameStatsForDataFile(stats));
  }

  async function copyCorrectionAudit() {
    if (!correctionAudit) return;
    await navigator.clipboard.writeText(formatStatCorrectionAudit(correctionAudit));
  }

  const parseErrors = fileErrors.length > 0 ? fileErrors : parsed.ok ? [] : parsed.errors;
  const errorCount = errors.length + canonicalProblems.length + (duplicateProblem ? 1 : 0) + (replacementProblem ? 1 : 0) + (unchangedProblem ? 1 : 0) + (auditMissing ? 1 : 0) + (auditNotFinalized ? 1 : 0);

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">Workflow</p>
            <h2 className="mt-2 text-2xl font-black">New import or correction</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">Corrections load the current verified record first and require an internal audit note before replacement output is approved.</p>
          </div>
          <button type="button" onClick={startNewImport} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/70">New Import</button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">Load existing verified stats</span>
            <select value={replacementTargetId} onChange={(event) => event.target.value && loadExistingRecord(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none">
              <option value="">Select a game to correct…</option>
              {existingStats.map((entry) => {
                const game = canonicalGames.find((candidate) => candidate.id === entry.gameId);
                return <option key={entry.gameId} value={entry.gameId}>{game ? formatGameLabel(game) : entry.gameId}</option>;
              })}
            </select>
          </label>
          <span className={`rounded-full border px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] ${mode === "replace" ? "border-amber-300/20 bg-amber-300/10 text-amber-50" : "border-white/10 bg-black/30 text-white/50"}`}>
            {mode === "replace" ? "Correction Mode" : "New Import Mode"}
          </span>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">Import Draft</p>
              <h2 className="mt-2 text-2xl font-black">{mode === "replace" ? "Edit existing stats" : "Paste JSON or upload CSV"}</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">{mode === "replace" ? "Make the verified correction below, then re-run identity and validation checks." : "Convert source data into one reviewable GameStats object."}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input ref={fileInput} type="file" accept="application/json,.json,text/plain,text/csv,.csv" className="hidden" onChange={(event) => loadFile(event.target.files?.[0])} />
              <button type="button" onClick={downloadCsvTemplate} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/60">CSV Template</button>
              <button type="button" onClick={() => fileInput.current?.click()} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/70">Upload JSON / CSV</button>
            </div>
          </div>

          <textarea
            value={raw}
            onChange={(event) => {
              setRaw(event.target.value);
              setResolved(null);
              setNotices([]);
              setFileErrors([]);
              invalidateAudit();
              if (mode === "new") {
                setSelectedGameId("");
                setConfirmedGameId("");
              }
            }}
            spellCheck={false}
            className="mt-5 min-h-[620px] w-full resize-y rounded-2xl border border-white/10 bg-black/45 p-4 font-mono text-xs leading-6 text-white/75 outline-none focus:border-white/25"
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" disabled={!stats || fileErrors.length > 0} onClick={resolvePlayers} className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-35">Resolve Player IDs</button>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">Canonical Game Match</p>
            <h2 className="mt-2 text-2xl font-black">Confirm the schedule record</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">A correction must remain attached to the same canonical game it is replacing.</p>

            {stats ? (
              <div className="mt-5 space-y-4">
                <select value={selectedGameId} onChange={(event) => { setSelectedGameId(event.target.value); setConfirmedGameId(""); invalidateAudit(); }} className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none">
                  <option value="">Select canonical game…</option>
                  {suggestedGames.map((game) => <option key={game.id} value={game.id}>{formatGameLabel(game)}{game.hasStats ? " · STATS ALREADY LOADED" : ""}</option>)}
                </select>
                {selectedGame && (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
                    <p className="font-black text-white/85">{formatGameLabel(selectedGame)}</p>
                    <p className="mt-2 text-xs text-white/40">Canonical ID: {selectedGame.id}</p>
                    {selectedGame.status === "final" && selectedGame.awayScore !== undefined && selectedGame.homeScore !== undefined && <p className="mt-1 text-xs text-white/40">Final: {selectedGame.awayScore}–{selectedGame.homeScore}</p>}
                  </div>
                )}
                <button type="button" disabled={!selectedGame} onClick={confirmCanonicalGame} className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white disabled:opacity-35">Apply & Confirm Game</button>
                {confirmedGame && !duplicateProblem && !replacementProblem && <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">Confirmed: {formatGameLabel(confirmedGame)}</div>}
                {duplicateProblem && <Issue level="error" message={duplicateProblem} />}
                {replacementProblem && <Issue level="error" message={replacementProblem} />}
                {canonicalProblems.map((problem) => <Issue key={problem} level="error" message={problem} />)}
              </div>
            ) : <p className="mt-5 text-sm text-white/35">Load a valid draft to see game matches.</p>}
          </section>

          {mode === "replace" && originalStats && stats && (
            <>
              <section className="rounded-[1.75rem] border border-amber-300/15 bg-amber-300/[0.04] p-6">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-100/55">Correction Comparison</p>
                <h2 className="mt-2 text-2xl font-black">What changed</h2>
                {changeSummary.length ? (
                  <div className="mt-4 space-y-2">{changeSummary.map((change) => <div key={change} className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white/65">{change}</div>)}</div>
                ) : <p className="mt-4 text-sm text-amber-50/60">No changes detected yet.</p>}
              </section>

              <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">Correction Audit</p>
                <h2 className="mt-2 text-2xl font-black">Record why the totals changed</h2>
                <p className="mt-2 text-sm leading-6 text-white/45">This stays internal. A reviewer, correction source, and note are required before replacement output can be approved.</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">Reviewed by</span>
                    <input value={reviewedBy} onChange={(event) => { setReviewedBy(event.target.value); setAuditRecordedAt(""); }} placeholder="Name or initials" className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none" />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">Prompted by</span>
                    <input value={promptedBy} onChange={(event) => { setPromptedBy(event.target.value); setAuditRecordedAt(""); }} placeholder="Coach email, stat sheet correction, etc." className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none" />
                  </label>
                </div>
                <label className="mt-4 block">
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">Correction note</span>
                  <textarea value={correctionNote} onChange={(event) => { setCorrectionNote(event.target.value); setAuditRecordedAt(""); }} placeholder="Briefly explain what was corrected and why." className="mt-2 min-h-28 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none" />
                </label>
                <button type="button" disabled={auditMissing || changeSummary.length === 0} onClick={finalizeCorrectionAudit} className="mt-4 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-35">Finalize Audit Entry</button>
                {auditRecordedAt && <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">Audit entry finalized at {auditRecordedAt}.</div>}
              </section>
            </>
          )}

          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">Review Status</p>
            {parseErrors.length > 0 ? (
              <div className="mt-5 space-y-2">{parseErrors.map((error) => <Issue key={error} level="error" message={error} />)}</div>
            ) : (
              <>
                <div className="mt-5 grid gap-3 sm:grid-cols-4">
                  <StatusCard label="Errors" value={errorCount} />
                  <StatusCard label="Warnings" value={warnings.length} />
                  <StatusCard label="Notices" value={notices.length} />
                  <StatusCard label="Game Match" value={confirmedGame && !duplicateProblem && !replacementProblem ? 1 : 0} />
                </div>
                <div className="mt-5 space-y-2">
                  {issues.length === 0 && confirmedGame && !approvalBlocked && <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">No blocking validation issues found.</div>}
                  {!confirmedGame && <Issue level="error" message="A canonical VarsityVue game must be confirmed before approval." />}
                  {unchangedProblem && <Issue level="error" message={unchangedProblem} />}
                  {mode === "replace" && auditMissing && <Issue level="error" message="Correction audit fields are required before replacement approval." />}
                  {mode === "replace" && !auditMissing && auditNotFinalized && <Issue level="error" message="Finalize the correction audit entry after reviewing the changes." />}
                  {issues.map((issue, index) => <Issue key={`${issue.level}-${index}-${issue.message}`} {...issue} />)}
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
                <span className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] ${approvalBlocked ? "border-red-400/20 bg-red-400/10 text-red-100" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"}`}>{approvalBlocked ? "Blocked" : mode === "replace" ? "Replacement ready" : "Ready for review"}</span>
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
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">Import & Identity Review</p>
              <div className="mt-4 space-y-2">{notices.map((notice, index) => <div key={`${index}-${notice}`} className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs leading-5 text-white/55">{notice}</div>)}</div>
            </section>
          )}

          {stats && (
            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">Approval Output</p>
              <h2 className="mt-2 text-2xl font-black">{mode === "replace" ? "Correction package" : "Production-ready object"}</h2>
              <p className="mt-2 text-sm leading-6 text-white/45">{mode === "replace" ? "Copy both the replacement GameStats object and the audit entry. The audit belongs in data/stat-corrections.ts." : "Copy is enabled only after canonical game confirmation, duplicate detection, and validation checks pass."}</p>
              <pre className="mt-5 max-h-[440px] overflow-auto rounded-2xl border border-white/10 bg-black/45 p-4 text-xs leading-6 text-white/65">{formatGameStatsForDataFile(stats)}</pre>
              <button type="button" disabled={approvalBlocked} onClick={copyApprovedJson} className="mt-4 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-35">{mode === "replace" ? "Copy Replacement JSON" : "Copy Approved JSON"}</button>

              {mode === "replace" && correctionAudit && (
                <>
                  <p className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-white/40">Internal audit entry</p>
                  <pre className="mt-3 max-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/45 p-4 text-xs leading-6 text-white/65">{formatStatCorrectionAudit(correctionAudit)}</pre>
                  <button type="button" disabled={approvalBlocked} onClick={copyCorrectionAudit} className="mt-4 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-35">Copy Audit JSON</button>
                </>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function sameStats(a: GameStats, b: GameStats) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function getChangeSummary(before: GameStats, after: GameStats) {
  const changes: string[] = [];
  const sections: { key: keyof GameStats; label: string }[] = [
    { key: "sourceLabel", label: "Source label" },
    { key: "quarterScores", label: "Quarter scores" },
    { key: "scoringPlays", label: "Scoring plays" },
    { key: "teamStats", label: "Team stats" },
    { key: "rushing", label: "Rushing stats" },
    { key: "passing", label: "Passing stats" },
    { key: "receiving", label: "Receiving stats" },
  ];

  for (const section of sections) {
    const oldValue = before[section.key];
    const newValue = after[section.key];
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        changes.push(`${section.label} changed (${oldValue.length} → ${newValue.length} rows).`);
      } else {
        changes.push(`${section.label} changed.`);
      }
    }
  }
  return changes;
}

function getCanonicalProblems(stats: GameStats | null, game?: CanonicalGame) {
  if (!stats || !game) return [];
  const problems: string[] = [];
  if (stats.season !== game.season) problems.push(`Draft season ${stats.season} does not match canonical season ${game.season}.`);

  const canonicalTeams = [game.homeSchoolSlug, game.awaySchoolSlug].filter(Boolean) as string[];
  const statTeams = Array.from(new Set([
    ...stats.quarterScores.map((line) => line.schoolSlug),
    ...stats.teamStats.map((line) => line.schoolSlug),
    ...stats.rushing.map((line) => line.schoolSlug),
    ...stats.passing.map((line) => line.schoolSlug),
    ...stats.receiving.map((line) => line.schoolSlug),
  ])).filter(Boolean);
  const outsiders = statTeams.filter((slug) => !canonicalTeams.includes(slug));
  if (outsiders.length) problems.push(`Stat data contains school(s) not in the canonical matchup: ${outsiders.join(", ")}.`);

  if (game.status === "final" && game.homeSchoolSlug && game.awaySchoolSlug && game.homeScore !== undefined && game.awayScore !== undefined) {
    const home = stats.quarterScores.find((line) => line.schoolSlug === game.homeSchoolSlug)?.total;
    const away = stats.quarterScores.find((line) => line.schoolSlug === game.awaySchoolSlug)?.total;
    if (home !== undefined && home !== game.homeScore) problems.push(`Imported ${game.homeSchoolSlug} final (${home}) does not match canonical final (${game.homeScore}).`);
    if (away !== undefined && away !== game.awayScore) problems.push(`Imported ${game.awaySchoolSlug} final (${away}) does not match canonical final (${game.awayScore}).`);
  }
  return problems;
}

function formatGameLabel(game: CanonicalGame) {
  const away = game.awayTeam ?? game.awaySchoolSlug ?? "Away";
  const home = game.homeTeam ?? game.homeSchoolSlug ?? "Home";
  const week = game.week !== undefined ? `Week ${game.week} · ` : "";
  const date = game.date ?? (game.kickoff ? game.kickoff.slice(0, 10) : "Date TBD");
  return `${week}${away} at ${home} · ${date}`;
}

function StatusCard({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-white/10 bg-black/30 p-4"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>;
}

function PreviewCard({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-white/10 bg-black/30 p-4"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/35">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>;
}

function Issue({ level, message }: { level: "error" | "warning"; message: string }) {
  return <div className={`rounded-xl border p-4 text-sm leading-6 ${level === "error" ? "border-red-400/20 bg-red-400/10 text-red-100" : "border-amber-300/20 bg-amber-300/10 text-amber-50"}`}><span className="mr-2 font-black uppercase tracking-[0.1em]">{level}</span>{message}</div>;
}

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
};

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

export default function GameStatsReviewTool({ canonicalGames }: { canonicalGames: CanonicalGame[] }) {
  const [raw, setRaw] = useState(starter);
  const [resolved, setResolved] = useState<GameStats | null>(null);
  const [notices, setNotices] = useState<string[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [confirmedGameId, setConfirmedGameId] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parseGameStatsDraft(raw), [raw]);
  const stats = resolved ?? (parsed.ok ? parsed.stats : null);
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
  const approvalBlocked = errors.length > 0 || !confirmedGame || canonicalProblems.length > 0;

  function resetReviewState() {
    setResolved(null);
    setNotices([]);
    setFileErrors([]);
    setSelectedGameId("");
    setConfirmedGameId("");
  }

  function resolvePlayers() {
    if (!stats) return;
    const result = resolveKnownPlayerIds(stats);
    setResolved(result.stats);
    setNotices((current) => [...current, ...result.notices]);
  }

  function useOriginalDraft() {
    setResolved(null);
    setNotices([]);
    setConfirmedGameId("");
  }

  function confirmCanonicalGame() {
    if (!stats || !selectedGame) return;
    const next = { ...stats, gameId: selectedGame.id, season: selectedGame.season };
    setResolved(next);
    setConfirmedGameId(selectedGame.id);
    setNotices((current) => [
      ...current,
      `Confirmed canonical game ${formatGameLabel(selectedGame)}.`,
    ]);
  }

  function loadFile(file?: File) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      resetReviewState();

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

  async function copyApprovedJson() {
    if (!stats || approvalBlocked) return;
    await navigator.clipboard.writeText(formatGameStatsForDataFile(stats));
  }

  const parseErrors = fileErrors.length > 0 ? fileErrors : parsed.ok ? [] : parsed.errors;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">Import Draft</p>
            <h2 className="mt-2 text-2xl font-black">Paste JSON or upload CSV</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">
              Convert source data into one reviewable GameStats object. Approval now requires matching the draft to a canonical VarsityVue game.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json,text/plain,text/csv,.csv"
              className="hidden"
              onChange={(event) => loadFile(event.target.files?.[0])}
            />
            <button type="button" onClick={downloadCsvTemplate} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/60 transition hover:bg-white/10 hover:text-white">
              CSV Template
            </button>
            <button type="button" onClick={() => fileInput.current?.click()} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/70 transition hover:bg-white/10 hover:text-white">
              Upload JSON / CSV
            </button>
          </div>
        </div>

        <textarea
          value={raw}
          onChange={(event) => {
            setRaw(event.target.value);
            resetReviewState();
          }}
          spellCheck={false}
          className="mt-5 min-h-[620px] w-full resize-y rounded-2xl border border-white/10 bg-black/45 p-4 font-mono text-xs leading-6 text-white/75 outline-none focus:border-white/25"
        />

        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" disabled={!stats || fileErrors.length > 0} onClick={resolvePlayers} className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition disabled:cursor-not-allowed disabled:opacity-35">
            Resolve Player IDs
          </button>
          {resolved && (
            <button type="button" onClick={useOriginalDraft} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/60">
              Use Original Draft
            </button>
          )}
        </div>
      </section>

      <div className="space-y-6">
        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">Canonical Game Match</p>
          <h2 className="mt-2 text-2xl font-black">Confirm the schedule record</h2>
          <p className="mt-2 text-sm leading-6 text-white/45">
            The production object cannot be approved until it is explicitly matched to an existing VarsityVue game.
          </p>

          {stats ? (
            <div className="mt-5 space-y-4">
              <select
                value={selectedGameId}
                onChange={(event) => {
                  setSelectedGameId(event.target.value);
                  setConfirmedGameId("");
                }}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none"
              >
                <option value="">Select canonical game…</option>
                {suggestedGames.map((game) => (
                  <option key={game.id} value={game.id}>{formatGameLabel(game)}</option>
                ))}
              </select>

              {selectedGame && (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
                  <p className="font-black text-white/85">{formatGameLabel(selectedGame)}</p>
                  <p className="mt-2 text-xs text-white/40">Canonical ID: {selectedGame.id}</p>
                  {selectedGame.status === "final" && selectedGame.awayScore !== undefined && selectedGame.homeScore !== undefined && (
                    <p className="mt-1 text-xs text-white/40">Final: {selectedGame.awayScore}–{selectedGame.homeScore}</p>
                  )}
                </div>
              )}

              <button type="button" disabled={!selectedGame} onClick={confirmCanonicalGame} className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-35">
                Apply & Confirm Game
              </button>

              {confirmedGame && (
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                  Confirmed: {formatGameLabel(confirmedGame)}
                </div>
              )}
              {canonicalProblems.map((problem) => <Issue key={problem} level="error" message={problem} />)}
            </div>
          ) : (
            <p className="mt-5 text-sm text-white/35">Load a valid draft to see game matches.</p>
          )}
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">Review Status</p>
          {parseErrors.length > 0 ? (
            <div className="mt-5 space-y-2">{parseErrors.map((error) => <Issue key={error} level="error" message={error} />)}</div>
          ) : (
            <>
              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                <StatusCard label="Errors" value={errors.length + canonicalProblems.length} />
                <StatusCard label="Warnings" value={warnings.length} />
                <StatusCard label="Notices" value={notices.length} />
                <StatusCard label="Game Match" value={confirmedGame ? 1 : 0} />
              </div>
              <div className="mt-5 space-y-2">
                {issues.length === 0 && confirmedGame && canonicalProblems.length === 0 && (
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">No validation issues found.</div>
                )}
                {!confirmedGame && <Issue level="error" message="A canonical VarsityVue game must be confirmed before approval." />}
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
              <span className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] ${approvalBlocked ? "border-red-400/20 bg-red-400/10 text-red-100" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"}`}>
                {approvalBlocked ? "Blocked" : "Ready for review"}
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
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">Import & Identity Review</p>
            <div className="mt-4 space-y-2">{notices.map((notice, index) => <div key={`${index}-${notice}`} className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs leading-5 text-white/55">{notice}</div>)}</div>
          </section>
        )}

        {stats && (
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">Approval Output</p>
            <h2 className="mt-2 text-2xl font-black">Production-ready object</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">Copy is enabled only after canonical game confirmation and all blocking validation checks pass.</p>
            <pre className="mt-5 max-h-[440px] overflow-auto rounded-2xl border border-white/10 bg-black/45 p-4 text-xs leading-6 text-white/65">{formatGameStatsForDataFile(stats)}</pre>
            <button type="button" disabled={approvalBlocked} onClick={copyApprovedJson} className="mt-4 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition disabled:cursor-not-allowed disabled:opacity-35">
              Copy Approved JSON
            </button>
          </section>
        )}
      </div>
    </div>
  );
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

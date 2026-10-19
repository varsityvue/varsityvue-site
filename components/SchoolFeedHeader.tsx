import type { ReactNode } from "react";
import Link from "next/link";
import type { School } from "@/types/platform";
import ProgramLogo from "./ProgramLogo";
import ShareAction from "./ShareAction";

export default function SchoolFeedHeader({ school, children }: { school: School; children?: ReactNode }) {
  return <header className="mt-5 rounded-2xl border border-white/15 bg-white/5 p-5 sm:p-6" style={{ borderTop: `4px solid ${school.colors.primary}` }}>
    <div className="flex min-w-0 items-center gap-4"><ProgramLogo school={school} size="sm" /><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-widest text-white/75 [overflow-wrap:anywhere]">{school.name} {school.mascot}</p><h1 className="mt-1 text-3xl font-black">Team Feed</h1></div></div>
    <p className="mt-4 text-sm leading-6 text-white/80">{school.mascot} football, in the moment. Game graphics, photos and quick updates curated by VarsityVue.</p>
    <div className="mt-4 flex flex-wrap items-center gap-3">{children}<ShareAction title={`${school.name} Team Feed | VarsityVue`} text={`See football graphics, photos and updates on the ${school.name} feed.`} url={`https://varsityvue.com/schools/${school.slug}/feed`} label="Share team feed" compact /></div>
    <Link href={`/schools/${school.slug}`} className="mt-4 inline-flex min-h-11 items-center text-sm font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Scores, schedule &amp; Follow Team →</Link>
  </header>;
}

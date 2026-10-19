import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import TeamFeedList from "@/components/TeamFeedList";
import ProgramLogo from "@/components/ProgramLogo";
import { getDistrictById } from "@/lib/districts";
import SchoolSubnav from "@/components/SchoolSubnav";
import { getSchoolBySlug } from "@/lib/schools";
import { getFeedPosts, isTeamFeedEnabled } from "@/lib/team-feed";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const school = getSchoolBySlug(slug);
  return { title: school && isTeamFeedEnabled(slug) ? `${school.name} Team Feed` : "Page Not Found" };
}

export default async function TeamFeedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const school = getSchoolBySlug(slug);
  if (!school || !isTeamFeedEnabled(slug)) notFound();
  const { posts, hasMore } = await getFeedPosts(school.id);
  return <main className="min-h-screen bg-[var(--vv-bg)] text-white"><SchoolSubnav schoolSlug={school.slug} districtSlug={getDistrictById(school.districtId)?.slug ?? school.districtId} theme={school.colors} />
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6"><Link href={`/schools/${slug}`} className="text-sm text-white/60">← {school.name} Hub</Link>{slug === "de-leon" ? <header className="mt-5 rounded-2xl border border-white/15 bg-white/5 p-5 sm:p-6" style={{ borderTop: `4px solid ${school.colors.primary}` }}><div className="flex min-w-0 items-center gap-4"><ProgramLogo school={school} size="sm" /><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-widest text-white/75 [overflow-wrap:anywhere]">{school.name} {school.mascot}</p><h1 className="mt-1 text-3xl font-black">Team Feed</h1></div></div><p className="mt-4 text-sm leading-6 text-white/80">Bearcats football, in the moment. Game graphics, photos and quick updates curated by VarsityVue.</p><Link href={`/schools/${slug}`} className="mt-4 inline-flex min-h-11 items-center text-sm font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Scores, schedule &amp; Follow Team →</Link></header> : <><h1 className="mt-3 text-3xl font-black">Team Feed</h1><p className="mt-2 text-sm text-white/60">VarsityVue graphics and game-night media for {school.name}.</p></>}
      <TeamFeedList initial={posts} hasMore={hasMore} slug={slug} />
    </div>
  </main>;
}

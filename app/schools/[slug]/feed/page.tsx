import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import TeamFeedList from "@/components/TeamFeedList";
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
  return <main className="min-h-screen bg-[var(--vv-bg)] text-white"><SchoolSubnav schoolSlug={school.slug} districtSlug={school.districtId} theme={school.colors} />
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6"><Link href={`/schools/${slug}`} className="text-sm text-white/60">← {school.name} Hub</Link><h1 className="mt-3 text-3xl font-black">Team Feed</h1><p className="mt-2 text-sm text-white/60">VarsityVue graphics and game-night media for {school.name}.</p>
      <TeamFeedList initial={posts} hasMore={hasMore} slug={slug} />
    </div>
  </main>;
}

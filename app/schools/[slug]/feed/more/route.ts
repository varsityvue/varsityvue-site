import { NextRequest, NextResponse } from "next/server";
import { getSchoolBySlug } from "@/lib/schools";
import { getFeedPosts, isTeamFeedEnabled } from "@/lib/team-feed";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const school = getSchoolBySlug(slug);
  if (!school || !isTeamFeedEnabled(slug)) return new NextResponse(null, { status: 404 });
  const at = request.nextUrl.searchParams.get("before");
  const id = request.nextUrl.searchParams.get("id");
  if (!at || Number.isNaN(Date.parse(at)) || !id || !/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse(null, { status: 400 });
  const page = await getFeedPosts(school.id, { at, id });
  return NextResponse.json(page, { headers: { "Cache-Control": "no-store" } });
}

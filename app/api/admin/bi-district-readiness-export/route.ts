import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canViewPlayoffPublishing } from "@/lib/playoff-publishing-access";
import { getDynamicGamesSnapshot } from "@/lib/dynamic-games";
import { getBiDistrictReadiness } from "@/lib/bidistrict-readiness";
import { serializeBiDistrictReadinessCsv } from "@/lib/bidistrict-readiness-csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claims?.claims?.sub) return new NextResponse("Unauthorized", { status: 401 });
  const { data: roles, error } = await supabase.from("user_roles").select("role").eq("user_id", claims.claims.sub);
  if (!canViewPlayoffPublishing(roles, Boolean(error))) return new NextResponse("Forbidden", { status: 403 });

  const snapshot = await getDynamicGamesSnapshot();
  if (snapshot.scoreLoadStatus === "failed") {
    return new NextResponse("Verified score feed unavailable; export blocked", { status: 503 });
  }
  const csv = serializeBiDistrictReadinessCsv(getBiDistrictReadiness(snapshot.games));
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="varsityvue-2026-bi-district-readiness.csv"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

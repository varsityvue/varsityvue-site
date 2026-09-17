import { drainProductEmails } from "@/lib/product-email-worker";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const outcomes = await drainProductEmails(5);
  return Response.json({ outcomes });
}

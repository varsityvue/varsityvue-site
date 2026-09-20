import { drainPickemEmailReminders, drainProductEmails, enqueuePickemEmailReminders } from "@/lib/product-email-worker";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pickemEnqueue = await enqueuePickemEmailReminders();
  const [outcomes, pickemOutcomes] = await Promise.all([
    drainProductEmails(5),
    drainPickemEmailReminders(3),
  ]);
  return Response.json({ outcomes, pickemEnqueue, pickemOutcomes });
}

import { applyProductEmailUnsubscribe } from "@/lib/product-email-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const result = await applyProductEmailUnsubscribe(token);
  if (!result.ok) return new Response("Invalid unsubscribe request", { status: 400 });
  return new Response(null, { status: 200 });
}

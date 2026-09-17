"use server";

import { redirect } from "next/navigation";

import { applyProductEmailUnsubscribe } from "@/lib/product-email-server";

export async function confirmProductEmailUnsubscribe(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const result = await applyProductEmailUnsubscribe(token);
  const params = new URLSearchParams({ status: result.ok ? "success" : "invalid" });
  if (result.ok) params.set("category", result.category);
  redirect(`/email/unsubscribe?${params.toString()}`);
}

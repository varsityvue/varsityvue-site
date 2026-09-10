import { NextResponse } from "next/server";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/mpqnjqen";
const ALLOWED_SUCCESS_PATHS = new Set([
  "/thank-you",
  "/sponsor-inquiry/success",
]);

export async function POST(request: Request) {
  const formData = await request.formData();
  const requestedSuccessPath = String(formData.get("_success_path") ?? "/thank-you");
  const successPath = ALLOWED_SUCCESS_PATHS.has(requestedSuccessPath)
    ? requestedSuccessPath
    : "/thank-you";

  formData.delete("_success_path");

  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.redirect(
        new URL(`${successPath}?status=error`, request.url),
        303
      );
    }

    return NextResponse.redirect(new URL(successPath, request.url), 303);
  } catch {
    return NextResponse.redirect(
      new URL(`${successPath}?status=error`, request.url),
      303
    );
  }
}

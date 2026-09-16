const returnOrigin = "https://varsityvue.invalid";

export function safeNextPath(
  value: string | null | undefined,
  fallback = "/account",
) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f]/.test(value)
  ) {
    return fallback;
  }

  try {
    const destination = new URL(value, returnOrigin);
    if (destination.origin !== returnOrigin) return fallback;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return fallback;
  }
}

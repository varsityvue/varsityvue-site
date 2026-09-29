export const reservedUsernames = new Set([
  "varsityvue", "admin", "administrator", "moderator", "support", "official",
]);

export function validateUsername(input: string, current: string | null) {
  if (!/^[A-Za-z0-9_]{3,30}$/.test(input.trim())) return { error: "invalid" as const };
  const canonical = input.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,30}$/.test(canonical)) return { error: "invalid" as const };
  if (reservedUsernames.has(canonical)) return { error: "reserved" as const };
  if (canonical === current) return { error: "no-op" as const };
  return { canonical };
}

export function centralDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago", dateStyle: "long", timeStyle: "short",
  }).format(new Date(value)) + " Central Time";
}

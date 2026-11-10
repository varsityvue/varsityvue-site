/** Fail-closed authorization for the private publishing dashboard. */
export function canViewPlayoffPublishing(
  roles: readonly { role: string }[] | null | undefined,
  roleReadFailed = false,
): boolean {
  return !roleReadFailed && Array.isArray(roles) && roles.some((row) => row.role === "admin");
}

type RpcResult = { error: unknown };

/** Resolve missing results after the exclusive Monday window, before finalizing.
 * Both RPCs retain their database authorization and outcome guards.
 */
export async function finalizePickemWithCutoffResolution({
  outcomeResolutionAt,
  nowMs,
  resolve,
  finalize,
}: {
  outcomeResolutionAt: string | null;
  nowMs: number;
  resolve: () => PromiseLike<RpcResult>;
  finalize: () => PromiseLike<RpcResult>;
}): Promise<RpcResult> {
  const cutoff = outcomeResolutionAt === null ? NaN : Date.parse(outcomeResolutionAt);
  if (!Number.isFinite(cutoff) || !Number.isFinite(nowMs)) {
    return { error: new Error("The contest result cutoff is not configured.") };
  }
  if (nowMs >= cutoff) {
    const resolved = await resolve();
    if (resolved.error) return resolved;
  }
  return await finalize();
}

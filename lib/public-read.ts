// Used only by read-only public rendering. Never wrap a mutation in this helper.
export const PUBLIC_READ_TIMEOUT_MS = 3000;
export function publicReadFetch(fetcher: typeof fetch = fetch): typeof fetch {
  return (input, init) => fetcher(input, { ...init, cache: "no-store",
    signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(PUBLIC_READ_TIMEOUT_MS)])
      : AbortSignal.timeout(PUBLIC_READ_TIMEOUT_MS) });
}
export async function optionalRead<T>(read: () => PromiseLike<T>, fallback: T): Promise<T> {
  try { return await read(); } catch { return fallback; }
}

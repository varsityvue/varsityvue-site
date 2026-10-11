import { createServerClient } from "@supabase/ssr";
import { cache } from "react";
import { publicReadFetch } from "@/lib/public-read";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function createClient(publicRead = false) {
  const { url, publishableKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    ...(publicRead ? { global: { fetch: publicReadFetch() } } : {}),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, headers) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot write cookies. proxy.ts refreshes sessions.
        }

        void headers;
      },
    },
  });
}

// React cache is request-scoped; cookies/identity never cross requests.
export const createPublicReadClient = cache(() => createClient(true));
export const readPublicClaims = cache(async () => {
  try { return await (await createPublicReadClient()).auth.getClaims(); }
  catch { return { data: null, error: new Error("Session temporarily unavailable") }; }
});

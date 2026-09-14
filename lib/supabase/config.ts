const fallbackUrl = "https://outsnqcwrqfllusnljtv.supabase.co";
const fallbackPublishableKey = "sb_publishable_o3Sdj_cZJnwRnvbmDmOG8g_2ZArWJ1r";

export function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackUrl,
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || fallbackPublishableKey,
  };
}

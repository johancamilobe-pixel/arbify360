import { createClient } from "@supabase/supabase-js";

// Cliente admin — usa SERVICE_ROLE_KEY, nunca exponerlo al cliente
export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession:   false,
      },
    }
  );
}
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cswxwjsntjmigyjqzkun.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Shared Supabase Client for client-side and edge auth/session handling
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Creates an authenticated Supabase admin client for server-side user management
 */
export function createAdminClient(serviceRoleKey?: string) {
  const key = serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin authentication");
  }
  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

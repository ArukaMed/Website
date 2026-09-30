import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cswxwjsntjmigyjqzkun.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzd3h3anNudGptaWd5anF6a3VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MDU1NDMsImV4cCI6MjEwNjI4MTU0M30.YsYtyNlZHL0S-g7NVYdNMhQN7tcX50U-RT3FkH86DvY";

/**
 * Shared Supabase Client for client-side and edge auth/session handling
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Creates an authenticated Supabase admin client for server-side user management
 */
export function createAdminClient(serviceRoleKey?: string) {
  const key =
    serviceRoleKey ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is required for admin authentication"
    );
  }
  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente Supabase server-side com service_role (scrapers, server actions, SSR)
// NUNCA expor esta função ao browser
export function createServerClient() {
  return createSupabaseClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Cliente Supabase server-side com anon key (para SSR de páginas públicas)
export function createServerAnonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

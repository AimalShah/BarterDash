const fallbackApiUrl = import.meta.env.DEV
  ? "http://localhost:3000/api/v1"
  : "https://barter-dash.vercel.app/api/v1";
const fallbackSupabaseUrl = "https://example.supabase.co";
const fallbackSupabaseAnonKey = "example-anon-key";

export const env = {
  apiUrl: import.meta.env.VITE_API_URL?.trim() || fallbackApiUrl,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.trim() || fallbackSupabaseUrl,
  supabaseAnonKey:
    import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || fallbackSupabaseAnonKey,
};

export const isSupabaseConfigured =
  env.supabaseUrl !== fallbackSupabaseUrl &&
  env.supabaseAnonKey !== fallbackSupabaseAnonKey;

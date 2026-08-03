import { createClient, type Session } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// getSession() can briefly return null on a fresh page load (e.g. typing
// a URL directly or hard-refreshing), because the client hasn't finished
// restoring the session from storage yet. This waits for that to happen
// instead of giving up immediately.
export async function getCurrentSession(): Promise<Session | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) return session;

  return new Promise<Session | null>((resolve) => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      subscription.unsubscribe();
      resolve(newSession);
    });

    setTimeout(() => {
      subscription.unsubscribe();
      resolve(null);
    }, 3000);
  });
}
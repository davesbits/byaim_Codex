import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cfg = window.APP_CONFIG;

export const supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    console.error("Error getting user", error);
  }
  return user;
}

export async function signInWithMagicLink(email) {
  return supabase.auth.signInWithOtp({ email });
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.reload();
}

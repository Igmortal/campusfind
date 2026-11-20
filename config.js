// Supabase > Project Settings > API. The anon key is safe to publish (security comes from the RLS rules in setup.sql).
// NEVER put the service_role key here.
window.CAMPUSFIND = {
  supabaseUrl: "YOUR_SUPABASE_URL",
  supabaseKey: "YOUR_SUPABASE_ANON_KEY",
  deskEmail: "lostandfound@yourcollege.edu" // where "I found this / This is mine" emails go
};

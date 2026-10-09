// =============================================================
// SUPABASE CLIENT — ActuarialUCC
// =============================================================
const SUPABASE_URL = "https://zrrvehekvkwqxepayoza.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nEQ5c5wlvhJ7308Ajkq244w_moInZa8c";

// Create the client
window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("✅ Supabase client initialised for", SUPABASE_URL);

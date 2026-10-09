// =============================================================
// SUPABASE CLIENT — ActuarialUCC
// =============================================================
// This file connects your website to your Supabase project.
// The URL and anon key are SAFE to expose here — they're meant
// to be public. Security is handled by RLS on the database.
// =============================================================

// ⚠️ REPLACE THESE TWO VALUES WITH YOUR OWN FROM SUPABASE
const SUPABASE_URL = "PASTE_YOUR_SUPABASE_URL_HERE";
const SUPABASE_ANON_KEY = "PASTE_YOUR_ANON_KEY_HERE";

// Create the client (exposed globally as window.sb)
window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Quick console message so you know it loaded
console.log("✅ Supabase client initialised for", SUPABASE_URL);

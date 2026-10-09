// =============================================================
// SUPABASE CLIENT — ActuarialUCC
// =============================================================
// This file connects your website to your Supabase project.
// The URL and anon key are SAFE to expose here — they're meant
// to be public. Security is handled by RLS on the database.
// =============================================================

// ⚠️ REPLACE THESE TWO VALUES WITH YOUR OWN FROM SUPABASE
const SUPABASE_URL = "https://zrrvehekvkwqxepayozs.supabase.co";
const SUPABASE_ = "sb_publishable_nE5Qcz5wvihJ730AjqZ44w_mo1nZa0c";

// Create the client (exposed globally as window.sb)
window.sb = window.supabase.createClient(zrrvehekvkwqxepayoza,sb_publishable_nE5Qcz5wvihJ730AjqZ44w_mo1nZa0c );

// Quick console message so you know it loaded
console.log("✅ Supabase client initialised for",zrrvehekvkwqxepayoza );

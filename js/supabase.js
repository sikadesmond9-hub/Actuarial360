// =============================================================
// SUPABASE CLIENT — ActuarialUCC
// =============================================================
const SUPABASE_URL = "https://zrrvehekvkwqxepayoza.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpycnZlaGVrdmt3cXhlcGF5b3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MDczMDcsImV4cCI6MjEwNzA4MzMwN30.j-IjC8womQ2cqCcPEg2M5D7oo_sy2miBRr6f3_Lr60s";

window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("✅ Supabase client initialised for", SUPABASE_URL);

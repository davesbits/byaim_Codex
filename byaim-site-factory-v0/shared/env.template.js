// Copy this file to env.<siteId>.js and adjust values.
// It is loaded on the window as window.APP_CONFIG.

window.APP_CONFIG = {
  SITE_ID: "example",
  SITE_NAME: "byAIm Example Site",
  PRIMARY_COLOR: "#243447",
  SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_PUBLIC_ANON_KEY",
  API_BASE_URL: "https://api.your-backend.example",
  // Optional: Cloudflare AI / RAG config hints for your worker
  CF_RAG_SOURCE: "auto",
};

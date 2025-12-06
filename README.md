# byAIm – Cloudflare Pages + Supabase Auth

Charitable AI & IT pre-consultation for people with MS and neurological conditions.

**Live site:** https://codex-cli.pages.dev

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ index.html  │  │ styles.css  │  │ Other HTML pages    │ │
│  │ chat.js     │  │ auth.js     │  │ (members, business) │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              functions/api/chat.ts                   │   │
│  │         (Pages Function → Workers AI + Vectorize)    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌────────────┐     ┌─────────────┐     ┌─────────────┐
   │  Supabase  │     │ Workers AI  │     │  Vectorize  │
   │    Auth    │     │ (LLaMA 3)   │     │  (RAG)      │
   └────────────┘     └─────────────┘     └─────────────┘
```

---

## Pages & Features

| Page | Auth Required | Description |
|------|---------------|-------------|
| `index.html` | No | Landing page with hero |
| `login.html` | No | Supabase Auth login (Google, GitHub, Email, Phone) |
| `contact.html` | No | Contact form |
| `members.html` | Yes | Members dashboard |
| `charities.html` | Yes | Free tech for charities & non-profits |
| `support.html` | Yes | Support & bookings |

---

## TODO: Supabase Auth Setup

### 1. Get your Supabase credentials

From your Supabase project dashboard → Settings → API:
- **Project URL**: `https://YOUR-PROJECT-ID.supabase.co`
- **Anon public key**: `eyJhbGciOi...` (safe to expose in frontend)

### 2. Update auth.js with your credentials

Edit `auth.js` lines 3-4:

```javascript
const SUPABASE_URL = "https://YOUR-PROJECT-ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_PUBLIC_KEY";
```

### 3. Configure OAuth providers in Supabase

Go to Supabase Dashboard → Authentication → Providers:

**Google OAuth:**
1. Enable Google provider
2. Add your Google OAuth credentials (from Google Cloud Console)
3. Set redirect URL: `https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback`

**GitHub OAuth:**
1. Enable GitHub provider  
2. Create GitHub OAuth App: https://github.com/settings/developers
3. Set callback URL: `https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback`
4. Add Client ID and Secret to Supabase

**Email (Magic Link):**
1. Already enabled by default
2. Configure SMTP in Supabase for custom email templates (optional)

**Phone (SMS):**
1. Enable Phone provider
2. Configure Twilio credentials for SMS delivery

### 4. Set Site URL in Supabase

Go to Authentication → URL Configuration:
- **Site URL**: `https://codex-cli.pages.dev`
- **Redirect URLs**: Add `https://codex-cli.pages.dev/*`

### 5. Deploy with credentials

```bash
# After updating auth.js
git add -A && git commit -m "feat: add Supabase credentials" && git push
npx wrangler pages deploy . --project-name=codex-cli
```

---

## TODO: Cloudflare Bindings

Add these in Cloudflare Dashboard → Workers & Pages → codex-cli → Settings → Functions → Bindings:

| Type | Variable Name | Value |
|------|---------------|-------|
| AI | `AI` | (Workers AI) |
| Vectorize | `VECTORIZE_INDEX` | `byaim-knowledge` |

---

## TODO: Ingest Knowledge Base

The chat widget uses RAG. To populate the vector index:

```bash
# 1. Add .txt files to knowledge/
# 2. Update scripts/ingest_example.mjs with real embeddings
# 3. Run:
NODE_ENV=development node scripts/ingest_example.mjs
```

---

## Login Methods (from auth.js)

| Method | Provider | How it works |
|--------|----------|--------------|
| Google | OAuth | Redirects to Google, returns to site |
| GitHub | OAuth | Redirects to GitHub, returns to site |
| Email | Magic Link | Sends login link via email |
| Phone | SMS OTP | Sends code via SMS (requires Twilio) |

---

## Local Development

```bash
# Start local dev server
npx wrangler pages dev .

# Note: Vectorize bindings don't work locally
# AI binding requires remote calls (charges apply)
```

---

## Deploy

```bash
# Manual deploy
npx wrangler pages deploy . --project-name=codex-cli

# Or push to GitHub (auto-deploys if connected)
git push
```

---

## File Structure

```
byAIm_cloudflare_fullstack_v4/
├── index.html          # Landing page
├── login.html          # Auth page
├── members.html        # Protected: Members dashboard
├── charities.html      # Protected: Charities & non-profits
├── support.html        # Protected: Support & bookings
├── contact.html        # Contact form
├── styles.css          # Full UI styles
├── auth.js             # Supabase auth logic
├── chat.js             # Chat widget (calls /api/chat)
├── functions/
│   └── api/
│       └── chat.ts     # Pages Function (AI + RAG)
├── knowledge/          # Text files for RAG
├── scripts/
│   └── ingest_example.mjs  # Vector ingestion
└── wrangler.toml       # Pages config
```

---

## Quick Checklist

- [ ] Add Supabase URL to `auth.js`
- [ ] Add Supabase Anon Key to `auth.js`
- [ ] Enable Google OAuth in Supabase + add credentials
- [ ] Enable GitHub OAuth in Supabase + add credentials
- [ ] Set Site URL in Supabase to `https://codex-cli.pages.dev`
- [ ] Add redirect URLs in Supabase
- [ ] Add AI binding in Cloudflare dashboard
- [ ] Add Vectorize binding in Cloudflare dashboard
- [ ] Deploy and test login flow
- [ ] (Optional) Configure Twilio for phone login
- [ ] (Optional) Ingest knowledge base for RAG

---

**Planned public launch: 2026**

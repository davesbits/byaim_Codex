# byAIm Site Factory (v0)

This project is a minimal starting point to generate multiple static site variants
sharing the same Supabase auth and Cloudflare Pages backend.

The flow:

1. You describe the site idea in the CLI.
2. The CLI calls an OpenAI-compatible endpoint to generate HTML + CSS.
3. The tool writes `public/<siteId>/index.html` and `styles.css`.
4. The site uses a shared Supabase-based auth header.
5. You deploy to Cloudflare Pages with Wrangler.
6. Optionally, you create DNS records (CNAME) via the Cloudflare API helper script.

## Prerequisites

- Node 18+ installed.
- Wrangler CLI installed globally: `npm install -g wrangler` (optional but convenient).
- A Cloudflare account and a Pages project.
- A Supabase project for auth.
- An OpenAI-compatible endpoint and API key.

## Environment

Set these environment variables before running the generator:

- `OPENAI_API_KEY` – your API key.
- `OPENAI_BASE_URL` – optional; defaults to `https://api.openai.com/v1`.
- `OPENAI_MODEL` – optional; default `gpt-4.1-mini`.

Example (macOS, zsh):

```sh
export OPENAI_API_KEY="sk-..."
export OPENAI_MODEL="gpt-4.1-mini"
```

## Install dependencies

From the project root:

```sh
npm install
```

## Generate a new site variant

```sh
npm run generate:site
```

The script will ask for:

- Short site name (used as `siteId`, e.g. `law`, `clinic`, `light`).
- Full site title.
- Tone / style.
- A description of what the site should do / say.

It then:

- Calls the model.
- Writes `public/<siteId>/index.html` and `styles.css`.
- Creates `shared/env.<siteId>.js` from `shared/env.template.js` if it does not exist.

Next, edit `shared/env.<siteId>.js` and set:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `API_BASE_URL` (if you have an API worker).

## Local dev

```sh
npx wrangler pages dev public
```

Then open:

- `http://localhost:8788/<siteId>/`

## Deploy to Cloudflare Pages

First time: create a Pages project in the Cloudflare dashboard or via CLI.

Then:

```sh
./scripts/deploy.sh byaim-sites
```

Replace `byaim-sites` with your Pages project name.

## DNS helper script

To create a CNAME for a subdomain to your Pages domain:

1. Get `CF_API_TOKEN` with DNS write permissions.
2. Get your `CF_ZONE_ID` from Cloudflare (for the domain, e.g. `byam.co.uk`).
3. Export them:

```sh
export CF_API_TOKEN="..."
export CF_ZONE_ID="..."
```

4. Run:

```sh
./scripts/create-dns-record.sh law law.byaim-sites.pages.dev
```

Adjust the target to the domain Cloudflare Pages gives you.

## Supabase auth

The shared auth layer lives in:

- `shared/auth.js`
- `shared/init-auth.js`
- `shared/env.<siteId>.js`

The generated HTML MUST contain:

- `id="loginBtn"` – a button for sign-in.
- `id="logoutBtn"` – a button for sign-out.
- `[data-user-email]` – an element where the email is shown when logged in.

The generator enforces these IDs via the model instructions.

## Cloudflare auto RAG

Any content under `public/` will be deployed as HTML pages. Cloudflare's
auto-RAG crawler can ingest this content as long as it is publicly accessible
(or accessible according to whatever config you use on the project).

No extra code is required here; just deploy and enable the crawler in the
Cloudflare dashboard.

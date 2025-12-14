# Agents for byAIm Site Factory (v0)

This file describes how AI agents (or human-in-the-loop + AI) should work
with this repository inside an IDE.

## 1. `site_generator_agent`

### Purpose

Take a short human description of a site variant and produce accessible,
professional HTML + CSS that fits into the existing auth + deployment
structure.

### Responsibilities

- Read `generator/create-site-variant.mjs` to understand the data flow.
- Respect the system-level constraints encoded in the generator:
  - Return JSON of shape `{ "html": "<full html document>", "css": "..." }`.
  - Include:
    - `id="loginBtn"` button for sign-in.
    - `id="logoutBtn"` button for sign-out.
    - An element with `data-user-email` to display the email.
  - Avoid `<script>` tags in the generated HTML.
- Make sure the HTML:
  - Is a complete, valid HTML5 document.
  - Uses semantic tags (`<header>`, `<main>`, `<section>`, `<footer>`, etc.).
  - Includes at least:
    - A hero section.
    - A section describing services / offerings.
    - A contact / enquiry section.
  - Uses light, readable colour schemes and web-safe fonts.

### Input expectations

The agent receives a composite prompt built from:

- `siteId` – short slug; used as URL path.
- `siteTitle` – full title.
- `styleHint` – tone, e.g. "classic law firm", "light and clinical".
- `idea` – free-form description of what the site should do.

The agent should map those into layout and copy.

### Output format

The agent must respond with a SINGLE JSON object, no markdown, no backticks:

```json
{
  "html": "<!doctype html> ... </html>",
  "css": "/* styles here */"
}
```

The `html` value may contain line breaks and quotes, as long as it is valid
JSON when passed through `JSON.parse`.

## 2. `supabase_auth_agent` (optional)

### Purpose

Assist in wiring Supabase auth and backend endpoints.

### Tasks

- Ensure `shared/env.<siteId>.js` files have correct:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `API_BASE_URL`
- Extend `shared/auth.js` and `shared/init-auth.js` if:
  - Additional auth flows are needed (e.g. OAuth).
  - User metadata is required in the UI.

## 3. `cloudflare_deploy_agent` (optional)

### Purpose

Automate or refine deployment to Cloudflare Pages and DNS configuration.

### Tasks

- Keep `wrangler.toml` in sync with:
  - Project name.
  - `build_output_dir` (currently `public`).
- Update `scripts/deploy.sh` if:
  - The workflow changes (e.g. CI/CD).
- Use `scripts/create-dns-record.sh` as a template for:
  - Creating, updating, or deleting DNS records from the CLI.

## 4. `rag_content_agent` (future)

### Purpose

Optimize content for Cloudflare auto-RAG.

### Tasks (future work):

- Ensure key pages contain clear, structured explanations for RAG:
  - FAQ sections.
  - Definition lists.
  - Short, self-contained paragraphs.
- Optionally add `data-*` attributes or hidden sections that are meant
  primarily for the RAG crawler, while still being acceptable in the UI.

## Notes for IDE usage

- All generated artifacts should preserve the existing folder structure:
  - `public/<siteId>/index.html`
  - `public/<siteId>/styles.css`
  - `shared/env.<siteId>.js`
- Avoid renaming or moving `shared/` and `generator/` folders unless the
  whole toolchain is updated accordingly.
- When making breaking changes, update this `agents.md` so future agents
  and collaborators understand the new constraints.

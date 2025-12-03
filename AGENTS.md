# Repository Guidelines

## Project Structure & Module Organization
- `index.html`, `styles.css`, and `chat.js` provide the static Pages surface and embed the chat widget. Keep assets lean; new UI components live beside these files unless they require build tooling.
- `functions/api/chat.ts` is the Cloudflare Worker entry point for `/api/chat`. Treat it as the only server boundary: add helpers inside `functions/` if you introduce additional routes or background jobs.
- `knowledge/` holds `.txt` sources for retrieval. Store raw text only—use the ingest script to push embeddings.
- `scripts/ingest_example.mjs` is the ingestion skeleton. Extend it (chunking, embedding, retries) rather than creating duplicate scripts.
- `wrangler.toml` centralizes bindings (`AI`, `VECTORIZE_INDEX`) and deployment metadata; keep alternative environments in `[env.<name>]` blocks instead of new files.

## Build, Test, and Development Commands
- `wrangler dev` — runs the Worker + static assets locally with live reload; pass `--local` to avoid remote calls while prototyping.
- `wrangler deploy` — publishes the Worker and assets; use only after verifying bindings exist in the target account.
- `NODE_ENV=development node scripts/ingest_example.mjs` — pushes `knowledge/*.txt` into Vectorize; replace `values` with real embeddings before production use.
- `curl -X POST http://127.0.0.1:8787/api/chat -d '{"question":"..."}'` — quickest smoke test for endpoint responses during CI or scripts.

## Coding Style & Naming Conventions
- TypeScript/JavaScript sticks to two-space indentation, double quotes, and `camelCase` variables; keep files under 200 lines by extracting helpers.
- Prefer descriptive binding names (e.g., `VECTORIZE_INDEX`, `AI`) and keep Worker routes under `/api/*`.
- For HTML/CSS, follow the existing BEM-lite class patterns (`.chat-widget__header`). Inline scripts belong in `chat.js`, not the HTML.
- Format Touch-ups: run `npx prettier --write chat.js functions/api/chat.ts scripts/*.mjs` before committing.

## Testing Guidelines
- No automated suite yet; rely on `wrangler dev` plus scripted `curl` calls that cover 200/400/405 paths.
- When changing retrieval logic, ingest a sample `.txt` and verify that `console.error` logs stay clean; attach logs to the PR.
- Add regression snippets in `knowledge/fixtures/` (ignored from deploy) if you need repeatable manual checks.

## Commit & Pull Request Guidelines
- Repository history is distributed as a skeleton, so follow Conventional Commits (`feat: add vector fallback`, `fix: handle empty question`). Keep subject ≤72 chars and describe motivation in the body.
- Each PR should include: purpose, testing notes (`wrangler dev`, ingest script output), configuration steps (bindings/secrets), and screenshots/GIFs for UI tweaks.
- Link relevant issues and call out any manual follow-up (e.g., “Run ingest after deploy”).

## Security & Configuration Tips
- Never commit tokens or `account_id`; populate `.dev.vars` or environment variables instead.
- Rotate Vectorize indices by creating a new `index_name`, backfilling via the ingest script, then updating `wrangler.toml` in a single PR to avoid downtime.
- Keep `knowledge/` limited to non-sensitive text; encrypted or private material should live outside the repo and be injected at ingest time.

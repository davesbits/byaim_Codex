# Agents.md — AI Price Calculator (Cloudflare + Supabase)

## Purpose
Guides Codex/IDE agents to build and maintain an AI pricing calculator
on Cloudflare Workers using Supabase.

## Architecture
- Frontend: existing Pages UI
- Backend: Cloudflare Worker API
- DB: Supabase table `current_prices`
- Updates: Cron-triggered Worker

## Security
- Frontend: SUPABASE_ANON_KEY (read-only)
- Worker: SUPABASE_SERVICE_ROLE_KEY (write)

## Rules
- Never overwrite history
- Only activate prices via is_active
- Deterministic math only
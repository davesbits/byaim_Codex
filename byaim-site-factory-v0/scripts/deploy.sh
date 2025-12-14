#!/usr/bin/env bash
set -e

PROJECT_NAME=${1:-byaim-sites}

echo "Deploying to Cloudflare Pages project: $PROJECT_NAME"
wrangler pages deploy public --project-name="$PROJECT_NAME"

#!/usr/bin/env bash
set -e

if [ -z "$CF_API_TOKEN" ] || [ -z "$CF_ZONE_ID" ]; then
  echo "CF_API_TOKEN and CF_ZONE_ID must be set in the environment."
  exit 1
fi

SUBDOMAIN="$1"
TARGET="$2"

if [ -z "$SUBDOMAIN" ] || [ -z "$TARGET" ]; then
  echo "Usage: $0 <subdomain> <target-hostname>"
  echo "Example: $0 law byaim-sites.pages.dev"
  exit 1
fi

echo "Creating CNAME ${SUBDOMAIN} -> ${TARGET}"

curl -sS -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "'"${SUBDOMAIN}"'",
    "content": "'"${TARGET}"'",
    "ttl": 120,
    "proxied": true
  }'

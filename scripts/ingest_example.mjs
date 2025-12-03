// scripts/ingest_example.mjs
// Example script for ingesting text chunks into a Cloudflare Vectorize index.
// You would run this locally with: node scripts/ingest_example.mjs
//
// It expects:
// - CLOUDFLARE_API_TOKEN with Vectorize permissions
// - CLOUDFLARE_ACCOUNT_ID
// - INDEX_NAME (matching wrangler.toml's index_name)

import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";

const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const indexName = process.env.INDEX_NAME || "byaim-knowledge";

if (!apiToken || !accountId) {
  console.error("Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in env.");
  process.exit(1);
}

// Very simple: read all .txt files from ./knowledge and add each as one vector.
// In practice you’d chunk and embed them first.
const knowledgeDir = new URL("../knowledge", import.meta.url).pathname;

async function main() {
  const files = await fs.readdir(knowledgeDir);
  for (const file of files) {
    if (!file.endsWith(".txt")) continue;
    const full = path.join(knowledgeDir, file);
    const text = await fs.readFile(full, "utf8");
    console.log("Uploading", file, "length", text.length);

    const body = {
      id: file,
      values: [],         // You will supply embeddings here in a real pipeline
      metadata: { text },
    };

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/vectorize/indexes/${indexName}/upsert`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ vectors: [body] }),
      }
    );

    if (!res.ok) {
      console.error("Failed to upsert", file, await res.text());
    } else {
      console.log("Upserted", file);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import fs from "fs";
import path from "path";
import readline from "readline";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const projectRoot = path.resolve(__dirname, "..");

const openAiBaseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const openAiApiKey = process.env.OPENAI_API_KEY;
const openAiModel = process.env.OPENAI_MODEL || "gpt-4.1-mini";

if (!openAiApiKey) {
  console.error("ERROR: OPENAI_API_KEY is not set in your environment.");
  process.exit(1);
}

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "site";
}

async function callOpenAI(prompt) {
  const body = {
    model: openAiModel,
    messages: [
      {
        role: "system",
        content: [
          "You generate professional, accessible HTML and CSS for small sites.",
          "Return ONLY a single JSON object with the following shape, no markdown, no extra text:",
          "{ \"html\": \"<full html document>\", \"css\": \"/* css here */\" }",
          "Requirements:",
          "- Use semantic HTML5 structure.",
          "- Include a header with a brand area and navigation.",
          "- Include a main area with at least: hero, services/sections, contact.",
          "- In the header, include login controls:",
          "  - A button with id=\"loginBtn\" for sign-in.",
          "  - A button with id=\"logoutBtn\" for sign-out.",
          "  - A span with attribute data-user-email for showing the email.",
          "- Use class 'hidden' to hide the logout button by default.",
          "- Make sure the design is friendly for screen readers.",
          "- Do NOT include <script> tags; those are injected by the host app.",
          "- Keep fonts web-safe; no external font CDNs.",
          "- Body background should be light by default.",
        ].join("\n"),
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.4,
  };

  const res = await fetch(openAiBaseUrl + "/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openAiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${text}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    console.error("Failed to parse JSON from model. Raw content:");
    console.error(content);
    throw err;
  }

  if (!parsed.html || !parsed.css) {
    throw new Error("Model response missing 'html' or 'css' fields");
  }

  return parsed;
}

function ensureEnv(siteId, siteTitle) {
  const envTemplatePath = path.join(projectRoot, "shared", "env.template.js");
  const targetEnvPath = path.join(projectRoot, "shared", `env.${siteId}.js`);

  if (fs.existsSync(targetEnvPath)) {
    console.log(`shared/env.${siteId}.js already exists; leaving as-is.`);
    return;
  }

  const template = fs.readFileSync(envTemplatePath, "utf-8");
  const replaced = template
    .replace('SITE_ID: "example"', `SITE_ID: "${siteId}"`)
    .replace('SITE_NAME: "byAIm Example Site"', `SITE_NAME: "${siteTitle}"`);
  fs.writeFileSync(targetEnvPath, replaced, "utf-8");
  console.log(`Created shared/env.${siteId}.js`);
}

function writeSiteFiles(siteId, html, css) {
  const siteDir = path.join(projectRoot, "public", siteId);
  fs.mkdirSync(siteDir, { recursive: true });

  let processedHtml = html;

  // Inject scripts before closing body if present; otherwise append at end.
  const injection = [
    `<script src="/shared/env.${siteId}.js"></script>`,
    `<script type="module" src="/shared/init-auth.js"></script>`,
  ].join("\n");

  if (processedHtml.includes("</body>")) {
    processedHtml = processedHtml.replace(
      "</body>",
      injection + "\n</body>"
    );
  } else {
    processedHtml += "\n" + injection;
  }

  fs.writeFileSync(path.join(siteDir, "index.html"), processedHtml, "utf-8");
  fs.writeFileSync(path.join(siteDir, "styles.css"), css, "utf-8");

  console.log(`Wrote public/${siteId}/index.html and styles.css`);
}

async function main() {
  console.log("=== byAIm Site Variant Generator (v0) ===");

  const rawName = await ask("Short site name (e.g. law, clinic, light): ");
  const siteId = slugify(rawName || "site");
  const siteTitle =
    (await ask("Full site title (e.g. byAIm Legal Support): ")) ||
    `byAIm ${siteId} Site`;
  const styleHint =
    (await ask("Tone / style (e.g. classic law firm, very light, tech startup): ")) ||
    "professional, calm";
  const idea =
    (await ask("Describe what this site should do / say:
> ")) ||
    "A simple informational site about AI & IT pre-consultation.";

  const prompt = [
    `Site identifier: ${siteId}`,
    `Full site title: ${siteTitle}`,
    `Tone / style: ${styleHint}`,
    "",
    "High-level description:",
    idea,
    "",
    "Please design a single-page static site following the requirements from the system prompt.",
  ].join("\n");

  console.log("\nContacting OpenAI-compatible endpoint...");
  const { html, css } = await callOpenAI(prompt);

  ensureEnv(siteId, siteTitle);
  writeSiteFiles(siteId, html, css);

  console.log("\nDone.");
  console.log(`Local preview:`);
  console.log(`  npx wrangler pages dev public`);
  console.log(`Then open: http://localhost:8788/${siteId}/`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

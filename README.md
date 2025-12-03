# byAIm – Cloudflare full‑stack v4 (skeleton)

This folder is a starting point for a full‑stack byAIm deployment on Cloudflare:

- **Static front‑end** (HTML/CSS/JS) – served via Cloudflare Pages or Workers Sites.
- **Chat endpoint** (`/api/chat`) – a Cloudflare Worker that performs Retrieval‑Augmented Generation (RAG)
  using Cloudflare Vectorize + Workers AI.
- **Ingestion script skeleton** – example Node script to push your knowledge text into a Vectorize index.

You are expected to fill in secrets (account ID, tokens, etc.) and possibly swap out the ingest logic
to use AutoRAG, OpenAI Agents, or another RAG pipeline.

---

## Structure

- `index.html` – simple landing page with the “Need help?” chat widget.
- `styles.css` – minimal layout + chat widget styling.
- `chat.js` – front‑end widget that calls `/api/chat`.
- `wrangler.toml` – Cloudflare configuration (Worker, AI binding, Vectorize index).
- `functions/api/chat.ts` – Worker code that:
  - reads `question` and `page` from the JSON POST body;
  - queries `env.VECTORIZE_INDEX` for relevant chunks;
  - calls `env.AI` (Workers AI) with a small system prompt and the retrieved context;
  - returns `{ answer: "..." }` for the front‑end.
- `knowledge/` – placeholder directory for your text knowledge files.
- `scripts/ingest_example.mjs` – simple skeleton to push `.txt` knowledge into Vectorize via HTTP.

---

## Quick dev steps

1. Install wrangler if you haven’t already:

   ```bash
   npm install -g wrangler
   ```

2. Edit `wrangler.toml`:

   - Set `account_id` to your real Cloudflare account ID.
   - Optionally change `name` and `index_name`.

3. Bind AI and Vectorize in your Cloudflare dashboard or via `wrangler`:

   - Create a Vectorize index named `byaim-knowledge` (or whatever you set in `wrangler.toml`).
   - Enable Workers AI and ensure the `AI` binding is configured.
   - In `wrangler.toml` we already declare:

     ```toml
     [ai]
     binding = "AI"

     [vectorize]
     binding = "VECTORIZE_INDEX"
     index_name = "byaim-knowledge"
     ```

4. Run locally:

   ```bash
   wrangler dev
   ```

   Then open the printed URL and test the “Need help?” chat. At first you won’t have any
   Vectorize data, but the Worker will still respond using the base model.

5. Ingest some test text into Vectorize:

   - Put `.txt` files into `knowledge/`.
   - Adjust `scripts/ingest_example.mjs` to *actually* embed text (e.g. using Workers AI or OpenAI embeddings)
     and fill the `values` array with your embedding vectors.
   - Set `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `INDEX_NAME` in your shell.
   - Run:

     ```bash
     node scripts/ingest_example.mjs
     ```

   - Query again via the chat widget – you should see the model start to use your context.

---

## Draft email to Cloudflare about non‑profit / credits

You can adapt the following email when contacting Cloudflare about non‑profit support
(for example, referencing Cloudflare’s startup / non‑profit credits programme and Project Galileo).

---

**Subject:** Enquiry about Cloudflare credits / support for small MS‑focused non‑profit project

Dear Cloudflare team,

I’m writing to ask about potential support or credits for a small, non‑profit project I am building,
which will be hosted entirely on Cloudflare.

The project is called **byAIm**. I live with multiple sclerosis (MS) and have limited mobility,
but over the last 30 years I’ve built up deep experience with IT, AI and automation.
byAIm is a charitable pre‑consultation service: instead of charging traditional fees,
I offer remote AI / IT advice and accessibility‑focused support, and ask people to donate
directly to MS and neurological charities.

Technically, the project is a full‑stack app running on Cloudflare, including:

- Cloudflare Pages for the front‑end.
- Cloudflare Workers + Workers AI for an embedded “help” agent and other logic.
- Cloudflare Vectorize / AI Search (RAG) for a small knowledge base about MS‑friendly tech,
  accessibility tips, and service information.
- (Optionally) R2 for storing documents and media that feed into the RAG pipeline.

In the early stages, usage will be modest – mainly low‑traffic informational pages,
a small knowledge base, and a chatbot that helps people and organisations understand what we do.
However, I’d like to future‑proof this so that, as more people use the service, cost remains predictable
and sustainable for a non‑profit.

I have a few questions:

1. Are there specific programmes, discounts or credits available for small non‑profits
   / disability‑focused projects using Cloudflare developer products (Workers, Pages, R2,
   Vectorize, Workers AI, AI Search / AutoRAG, etc.)?
2. If so, what information do you need from me (e.g. proof of charitable status, projected usage,
   documentation, etc.) to evaluate an application?
3. Are there any best‑practice guidelines you recommend for keeping costs low for this kind of
   project (for example, limits on vector index size, caching strategies, or use of R2 vs other storage)?

My primary goals are:

- To keep the core service sustainable for the long term, without introducing traditional fees.
- To keep data and infrastructure in one place (Cloudflare), so I can focus my limited energy
  on helping people instead of managing many different platforms.
- To be able to share what I learn with other small charities and community groups, so they can
  also benefit from Cloudflare’s platform in an affordable way.

If there is a particular team, form, or programme (for example, any non‑profit or Project Galileo‑style
initiative) that I should apply through, I would appreciate a pointer.

Thank you for your time and for any guidance you can offer.

Kind regards,

[Your name]
Founder, byAIm
[Your preferred contact details]

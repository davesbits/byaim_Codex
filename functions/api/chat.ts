// functions/api/chat.ts
// Cloudflare Worker handler for /api/chat
// Uses Vectorize for retrieval and Workers AI for generation.
//
// Bindings (set in wrangler.toml):
// - env.AI               : Workers AI binding
// - env.VECTORIZE_INDEX  : Vectorize index binding
// - env.ASSETS           : Static assets binding

export interface Env {
  AI: any;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  VECTORIZE_INDEX?: {
    query: (text: string, options?: Record<string, unknown>) => Promise<any>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle API routes
    if (url.pathname === "/api/chat") {
      return handleChat(request, env);
    }

    // Serve static assets for all other routes
    return env.ASSETS.fetch(request);
  },
};

async function handleChat(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const question = (body.question || "").toString().trim();
    const page = (body.page || "home").toString();

    if (!question) {
      return new Response(
        JSON.stringify({ error: "Missing question" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // --- 1. Retrieve relevant chunks from Vectorize (if bound) ---
    let retrievedText = "";
    if (env.VECTORIZE_INDEX?.query) {
      try {
        const queryResult = await env.VECTORIZE_INDEX.query(question, {
          topK: 5,
        });
        // queryResult.matches: [{ score, metadata: { text, source, ... } }, ...]
        const chunks = (queryResult.matches || [])
          .map((m: any) => m.metadata?.text)
          .filter(Boolean)
          .slice(0, 5);
        retrievedText = chunks.join("\n\n");
      } catch (e) {
        // If Vectorize isn’t ready yet, just fall back to no context.
        console.error("Vectorize query failed:", e);
      }
    } else {
      console.info("Vectorize binding missing; continuing without retrieval context.");
    }

    // --- 2. Call Workers AI LLM with the question + context ---
    const systemPrompt = [
      "You are a calm, concise assistant on the byAIm website.",
      "The site is about charitable AI & IT pre‑consultation,",
      "run by someone living with multiple sclerosis (MS).",
      "Be practical, kind and realistic about fatigue and accessibility.",
      "If you don’t know, say so and suggest the contact form."
    ].join(" ");

    const model = "@cf/meta/llama-3-8b-instruct";

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "system",
        content:
          "Page context: " + page +
          ". Use the following retrieved notes if they are relevant:\n\n" +
          (retrievedText || "[no extra notes available yet]"),
      },
      { role: "user", content: question },
    ];

    let answerText = "I’m not sure how to answer that yet.";
    try {
      const aiRes: any = await env.AI.run(model, { messages });
      // Workers AI Chat interface returns { response: "..." } or { output_text: "..." }
      answerText =
        aiRes?.response ||
        aiRes?.output_text ||
        JSON.stringify(aiRes || {});
    } catch (e) {
      console.error("AI run failed:", e);
    }

    return new Response(
      JSON.stringify({ answer: answerText }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  },
};

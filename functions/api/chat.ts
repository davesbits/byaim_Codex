// functions/api/chat.ts
// Pages Function handler for /api/chat
// Uses Vectorize for retrieval and Workers AI for generation.

interface Env {
  AI: any;
  VECTORIZE_INDEX?: {
    query: (text: string, options?: Record<string, unknown>) => Promise<any>;
  };
}

interface PagesContext {
  request: Request;
  env: Env;
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context;

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
      const chunks = (queryResult.matches || [])
        .map((m: any) => m.metadata?.text)
        .filter(Boolean)
        .slice(0, 5);
      retrievedText = chunks.join("\n\n");
    } catch (e) {
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
    "If you don't know, say so and suggest the contact form."
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

  let answerText = "I'm not sure how to answer that yet.";
  try {
    const aiRes: any = await env.AI.run(model, { messages });
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
}

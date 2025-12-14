// functions/api/chat.ts
// Pages Function handler for /api/chat
// Uses Vectorize for retrieval and Workers AI for generation.

interface Env {
  AI: any;
  VECTORIZE_INDEX?: {
    query: (text: string, options?: Record<string, unknown>) => Promise<any>;
  };
  KNOWLEDGE_STORE: KVNamespace;
}

interface KVNamespace {
    put(key: string, value: string | ReadableStream | ArrayBuffer, options?: any): Promise<void>;
    list(options?: any): Promise<any>;
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
      const userId = request.headers.get("X-User-Id"); // Passed from frontend

      // Only query if we have a user or if we allow public data (logic depends on requirements)
      // For now, if userId is present, we try to filter. If not, maybe search public??
      // Given the requirement is "per user knowledge", let's strict filter if userId is present.
      
      const queryOptions: any = { topK: 5 };
      if (userId) {
            queryOptions.filter = { userId };
      }

      const queryResult = await env.VECTORIZE_INDEX.query(question, queryOptions);
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

  // --- 3. Keyword/Contact Extraction (Post-processing) ---
  let extractedInfo: any = {};
  try {
      if (env.AI) {
        // Ask a smaller model to extract details
        const extractionPrompt = [
          { role: "system", content: "Extract any contact details (name, email, phone) and the main inquiry keyword from this conversation. Return JSON only: { contact_name, contact_email, contact_phone, inquiry_topic }." },
          { role: "user", content: `User: ${question}\nAssistant: ${answerText}` }
        ];
        const extractRes: any = await env.AI.run("@cf/meta/llama-3-8b-instruct", { messages: extractionPrompt });
        const extractText = extractRes?.response || extractRes?.output_text || "";
        
        // Simple heuristic attempt to parse JSON if model returns text wrapping it
        const jsonMatch = extractText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            extractedInfo = JSON.parse(jsonMatch[0]);
        }
      }
  } catch (e) {
      console.error("Extraction failed:", e);
  }


  // --- 4. Store Conversation History ---
  try {
      const userId = request.headers.get("X-User-Id");
      if (userId && env.KNOWLEDGE_STORE) {
          const timestamp = new Date().toISOString();
          const chatKey = `chat:${userId}:${timestamp}`;
          
          await env.KNOWLEDGE_STORE.put(chatKey, JSON.stringify({
              question,
              answer: answerText,
              extracted: extractedInfo,
              timestamp
          }), {
              metadata: {
                  userId,
                  type: "chat_history",
                  summary: question.substring(0, 50) + "...",
                  inquiry: extractedInfo.inquiry_topic || "General",
                  hasContact: !!(extractedInfo.contact_email || extractedInfo.contact_phone)
              },
              expirationTtl: 60 * 60 * 24 * 60 // 60 days
          });
      }
  } catch (e) {
      console.error("Failed to store chat history:", e);
  }

  return new Response(
    JSON.stringify({ answer: answerText, extracted: extractedInfo }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

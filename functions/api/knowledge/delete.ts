
interface Env {
  KNOWLEDGE_STORE: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const body = await request.json() as { key: string };

    if (!body.key) {
      return new Response("Missing key", { status: 400 });
    }

    // Security Check: Ensure the key belongs to the current user
    const userId = "user_123"; // TODO: Replace with actual auth logic
    if (!body.key.startsWith(`${userId}:`)) {
        return new Response("Unauthorized", { status: 403 });
    }

    await env.KNOWLEDGE_STORE.delete(body.key);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500 });
  }
}

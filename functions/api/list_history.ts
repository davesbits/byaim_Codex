interface Env {
  KNOWLEDGE_STORE: KVNamespace;
}

interface KVNamespace {
    list(options?: any): Promise<any>;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const userId = request.headers.get("X-User-Id");

  if (!userId) {
    return new Response("Unauthorized: Missing User ID", { status: 401 });
  }

  // Prefix for chat history: "chat:<userId>:"
  const prefix = `chat:${userId}:`;
  const list = await env.KNOWLEDGE_STORE.list({ prefix });
  
  const history = list.keys.map(k => ({
    timestamp: k.name.replace(prefix, ''),
    metadata: k.metadata
  }));

  // Sort by newest first
  history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return new Response(JSON.stringify(history), {
    headers: { "Content-Type": "application/json" }
  });
}


interface Env {
  KNOWLEDGE_STORE: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const userId = request.headers.get("X-User-Id");

  if (!userId) {
    return new Response("Unauthorized: Missing User ID", { status: 401 });
  }

  const prefix = `${userId}:`;
  const list = await env.KNOWLEDGE_STORE.list({ prefix });
  
  const keys = list.keys.map(k => ({
    name: k.name.replace(prefix, ''), // verify this removes the prefix correctly
    expiration: k.expiration,
    metadata: k.metadata
  }));

  return new Response(JSON.stringify(keys), {
    headers: { "Content-Type": "application/json" }
  });
}

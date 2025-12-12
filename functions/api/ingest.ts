
interface Env {
      KNOWLEDGE_STORE: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
      try {
            const { request, env } = context;
            const body = await request.json() as {
                  type: 'url' | 'text',
                  content: string,
                  slug: string
            };

            if (!body.slug || !body.content) {
                  return new Response("Missing slug or content", { status: 400 });
            }

            let markdown = body.content;

            // simplistic approach: if it's a URL, we might want to fetch it.
            // However, the prompt says "input off the site url that you want to push the scrapped data... input is page to add url,txt,csv markdown with file picker"
            // So if type is URL, we fetch and convert. If type is text, we just save.

            // Get User ID from auth (assuming auth middleware or header)
            // For now, we'll simulate or grab from a header if available, or default to 'public'
            // In a real app, use context.data.user or similar from auth middleware
            const userId = "user_123"; // TODO: Replace with actual auth logic
            const key = `${userId}:${body.slug}`;

            if (body.type === 'url') {
                  // Use a more robust fetch or a scraping service if possible.
                  // Many sites block simple fetches.
                  const fetchResp = await fetch(body.content, {
                        headers: { 
                              "User-Agent": "Mozilla/5.0 (compatible; ByAimCrawler/1.0; +http://byaim.com)",
                              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
                        }
                  });
                  
                  if (!fetchResp.ok) throw new Error(`Failed to fetch target URL: ${fetchResp.status}`);
                  
                  // Check if we got redirected to a login page or homepage
                  if (fetchResp.url !== body.content && !fetchResp.url.includes(body.content)) {
                         // This is a hint that we might have been redirected
                         console.warn(`Redirected from ${body.content} to ${fetchResp.url}`);
                  }

                  const html = await fetchResp.text();
                  
                  // Basic HTML to Markdown (very simple regex based for now to avoid heavy deps)
                  // Remove scripts and styles
                  const cleanHtml = html
                        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")
                        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, "");
                  
                  markdown = `---
source: ${body.content}
ingested: ${new Date().toISOString()}
---

# Content from ${body.content}

${cleanHtml.substring(0, 50000)} 
`;
            }

            await env.KNOWLEDGE_STORE.put(key, markdown);

            return new Response(JSON.stringify({ success: true, slug: body.slug }), {
                  headers: { "Content-Type": "application/json" }
            });

      } catch (e) {
            return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500 });
      }
}

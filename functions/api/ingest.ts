
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

            if (body.type === 'url') {
                  const fetchResp = await fetch(body.content, {
                        headers: { "User-Agent": "ByAimCrawler/1.0" }
                  });
                  if (!fetchResp.ok) throw new Error("Failed to fetch target URL");

                  const html = await fetchResp.text();
                  // Very simple extraction for now - just saving raw HTML or wrapping it
                  // In a real app we'd use robust HTML->MD converter. 
                  // For KISS, let's wrap it in a code block or just save as is if we want to render it later?
                  // The requirement: "writes markdown that can be crawled... added to knowledge"
                  // Let's create a simple markdown wrapper
                  markdown = `---
source: ${body.content}
ingested: ${new Date().toISOString()}
---

# Content from ${body.content}

${html.substring(0, 10000)} 
<!-- Truncated/Raw HTML for now as we lack a heavy parser in this edge function without deps -->
`;
            }

            await env.KNOWLEDGE_STORE.put(body.slug, markdown);

            return new Response(JSON.stringify({ success: true, slug: body.slug }), {
                  headers: { "Content-Type": "application/json" }
            });

      } catch (e) {
            return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500 });
      }
}

interface Env {
      AI: any;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
      try {
            const { request } = context;
            const body = await request.json() as { url: string };
            const url = body.url;

            if (!url) {
                  return new Response("Missing URL", { status: 400 });
            }

            const response = await fetch(url, {
                  headers: {
                        "User-Agent": "ByAimCrawler/1.0"
                  }
            });

            if (!response.ok) {
                  return new Response(`Failed to fetch URL: ${response.statusText}`, { status: 502 });
            }

            const text = await response.text();

            // Return a summary of the crawled content
            return new Response(JSON.stringify({
                  url,
                  status: response.status,
                  length: text.length,
                  content_preview: text.substring(0, 500)
            }), {
                  headers: { "Content-Type": "application/json" }
            });

      } catch (e) {
            return new Response(`Error: ${e instanceof Error ? e.message : String(e)}`, { status: 500 });
      }
}

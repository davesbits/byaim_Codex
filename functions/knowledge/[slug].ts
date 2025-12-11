
import { marked } from 'marked';

interface Env {
      KNOWLEDGE_STORE: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
      const { params, env } = context;
      const slug = params.slug as string;

      const content = await env.KNOWLEDGE_STORE.get(slug);

      if (!content) {
            return new Response("Not Found", { status: 404 });
      }

      const htmlContent = marked.parse(content);

      // We need to wrap this in the site layout.
      // For simplicity since we can't easily import the EJS template here in a Function without bundling issues sometimes,
      // we will construct a basic HTML response or fetch the layout if possible.
      // To keep it robust, let's output a clean HTML page that inherits the site's CSS.

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>KnowledgeBase: ${slug}</title>
    <link rel="stylesheet" href="/styles.css">
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
    <div class="site-shell">
        <header>
            <div class="header-inner">
                <div class="brand">
                    <div class="brand-mark"></div>
                    <div class="brand-text">by<span>AIm</span></div>
                </div>
                <nav>
                    <a href="/" class="nav-link">Home</a>
                    <a href="/knowledge" class="nav-link">Index</a>
                </nav>
            </div>
        </header>
        <main>
             <div class="container content-wrapper" style="padding: 2rem; max-width: 800px; margin: 0 auto;">
                <article class="prose">
                    ${htmlContent}
                </article>
             </div>
        </main>
    </div>
</body>
</html>`;

      return new Response(html, {
            headers: { "Content-Type": "text/html" }
      });
}

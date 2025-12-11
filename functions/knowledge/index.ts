
interface Env {
      KNOWLEDGE_STORE: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
      const { env } = context;

      const list = await env.KNOWLEDGE_STORE.list();

      const links = list.keys.map(key => `<li><a href="/knowledge/${key.name}">${key.name}</a></li>`).join('');

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Knowledge Index</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div class="site-shell">
        <main>
             <div class="container" style="padding: 2rem;">
                <h1>Knowledge Index</h1>
                <ul>
                    ${links}
                </ul>
                <a href="/crawler.html" class="btn btn--primary">Add New Content</a>
             </div>
        </main>
    </div>
</body>
</html>`;

      return new Response(html, {
            headers: { "Content-Type": "text/html" }
      });
}

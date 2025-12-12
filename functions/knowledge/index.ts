
interface Env {
      KNOWLEDGE_STORE: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
      const { env } = context;

      const userId = "user_123"; // TODO: Replace with actual auth logic
      const list = await env.KNOWLEDGE_STORE.list({ prefix: `${userId}:` });

      const links = list.keys.map(key => {
            const cleanName = key.name.replace(`${userId}:`, '');
            return `
            <li style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; background: rgba(255,255,255,0.05); padding: 0.5rem; border-radius: 4px;">
                  <a href="/knowledge/${cleanName}" style="color: #fff; text-decoration: none;">${cleanName}</a>
                  <button onclick="deleteItem('${key.name}')" style="background: #ff4444; border: none; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Delete</button>
            </li>`;
      }).join('');

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Knowledge Index</title>
    <link rel="stylesheet" href="/styles.css">
    <script>
        async function deleteItem(key) {
            if(!confirm('Are you sure you want to delete this item?')) return;
            
            try {
                const res = await fetch('/api/knowledge/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key })
                });
                
                if(res.ok) {
                    window.location.reload();
                } else {
                    alert('Failed to delete');
                }
            } catch(e) {
                alert('Error deleting item');
            }
        }
    </script>
</head>
<body>
    <div class="site-shell">
        <main>
             <div class="container" style="padding: 2rem; max-width: 800px; margin: 0 auto;">
                <h1>Knowledge Index</h1>
                <ul style="list-style: none; padding: 0;">
                    ${links}
                </ul>
                <a href="/crawler.html" class="btn btn--primary" style="margin-top: 1rem; display: inline-block;">Add New Content</a>
             </div>
        </main>
    </div>
</body>
</html>`;

      return new Response(html, {
            headers: { "Content-Type": "text/html" }
      });
}

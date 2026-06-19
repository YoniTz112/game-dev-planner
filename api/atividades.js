export default async function handler(req, res) {
  const TOKEN = process.env.GITHUB_TOKEN;
  const GIST_ID = process.env.GIST_ID;
  const WRITE_KEY = process.env.WRITE_KEY || '';

  if (!TOKEN || !GIST_ID) {
    return res.status(500).json({ error: 'GITHUB_TOKEN and GIST_ID environment variables must be set' });
  }

  const gistUrl = `https://api.github.com/gists/${GIST_ID}`;

  try {
    if (req.method === 'GET') {
      const r = await fetch(gistUrl, {
        headers: { Authorization: `token ${TOKEN}`, Accept: 'application/vnd.github+json' }
      });
      if (!r.ok) return res.status(r.status).json({ error: 'Failed fetching gist' });
      const data = await r.json();
      const file = data.files && data.files['data.json'];
      const content = file && file.content ? file.content : '[]';
      try {
        const parsed = JSON.parse(content);
        return res.status(200).json(parsed);
      } catch (e) {
        return res.status(200).json([]);
      }
    }

    if (req.method === 'POST') {
      // optional simple write protection using a shared key
      if (WRITE_KEY) {
        const headerKey = req.headers['x-write-key'] || req.headers['x_write_key'];
        if (headerKey !== WRITE_KEY) return res.status(401).json({ error: 'Invalid write key' });
      }

      // body parsing: Vercel provides parsed JSON in req.body for application/json
      const payload = req.body;
      if (!payload) return res.status(400).json({ error: 'Empty body' });

      const patchRes = await fetch(gistUrl, {
        method: 'PATCH',
        headers: { Authorization: `token ${TOKEN}`, 'Content-Type': 'application/json', Accept: 'application/vnd.github+json' },
        body: JSON.stringify({ files: { 'data.json': { content: JSON.stringify(payload, null, 2) } } })
      });

      if (!patchRes.ok) {
        const txt = await patchRes.text();
        return res.status(patchRes.status).json({ error: 'Failed updating gist', detail: txt });
      }

      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end('Method Not Allowed');
  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: String(err) });
  }
}

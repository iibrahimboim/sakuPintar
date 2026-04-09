/**
 * Vercel Serverless: proxy semua /api/* ke Railway (hindari CORS + rewrite eksternal yang sering 404).
 * Set env di Vercel (opsional): RAILWAY_API_BASE=https://xxxx.up.railway.app
 */
export default async function handler(req, res) {
  const base = (process.env.RAILWAY_API_BASE || 'https://sakupintar-production.up.railway.app').replace(
    /\/$/,
    ''
  );

  const u = new URL(req.url, 'http://localhost');
  const target = `${base}${u.pathname}${u.search}`;

  const headers = {};
  const auth = req.headers.authorization;
  const ct = req.headers['content-type'];
  if (auth) headers.authorization = auth;
  if (ct) headers['content-type'] = ct;

  const init = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (req.body !== undefined && req.body !== null) {
      init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }
  }

  try {
    const r = await fetch(target, init);
    const text = await r.text();
    const outCt = r.headers.get('content-type');
    if (outCt) res.setHeader('content-type', outCt);
    res.status(r.status).send(text);
  } catch (e) {
    res.status(502).json({
      message: 'Proxy error ke Railway',
      detail: process.env.NODE_ENV === 'development' ? String(e?.message || e) : undefined,
    });
  }
}

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const TARGET = 'https://tdjqtbnacgpisuefruva.supabase.co';
const PROXY_URL = process.env.PROXY_URL || 'https://vedh-supabase-proxy-production.up.railway.app';

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

app.get('/health', (_, res) => res.send('ok'));

app.options('*', (req, res) => {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  res.sendStatus(204);
});

app.use((req, res, next) => {
  console.log(`[PROXY] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(createProxyMiddleware({
  target: TARGET,
  changeOrigin: true,
  followRedirects: false, // ← KEY: Don't follow 302s, let browser follow after rewrite
  onProxyReq(proxyReq, req) {
    proxyReq.path = req.originalUrl;
    console.log(`[PROXY] Forwarding to: ${TARGET}${proxyReq.path}`);
  },
  onProxyRes(proxyRes) {
    // Add CORS headers
    Object.entries(CORS_HEADERS).forEach(([k, v]) => {
      proxyRes.headers[k] = v;
    });

    // ★ Rewrite Location headers so OAuth callbacks route through proxy
    const location = proxyRes.headers['location'];
    if (location && typeof location === 'string') {
      // Replace URL-encoded references (inside Google's redirect_uri param)
      let rewritten = location.replaceAll(
        encodeURIComponent(TARGET),
        encodeURIComponent(PROXY_URL)
      );
      // Replace plain references
      rewritten = rewritten.replaceAll(TARGET, PROXY_URL);

      if (rewritten !== location) {
        console.log(`[PROXY] Rewrote Location:\n  FROM: ${location}\n  TO:   ${rewritten}`);
      }
      proxyRes.headers['location'] = rewritten;
    }
  },
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy listening on ${PORT}`));

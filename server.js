const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const TARGET = 'https://tdjqtbnacgpisuefruva.supabase.co';
const PORT = process.env.PORT || 3000;

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

// Preflight for all routes
app.options('*', (_req, res) => {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  return res.sendStatus(204);
});

// Main proxy: preserve /functions/v1/* path as-is
app.use(
  '/functions/v1',
  createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    logLevel: 'debug',
    onProxyRes(proxyRes) {
      Object.entries(CORS_HEADERS).forEach(([k, v]) => {
        proxyRes.headers[k] = v;
      });
    },
  })
);

// Health + root
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/', (_req, res) => res.json({ status: 'ok', service: 'vedh-supabase-proxy' }));

app.listen(PORT, () => console.log(`Proxy listening on ${PORT}`));

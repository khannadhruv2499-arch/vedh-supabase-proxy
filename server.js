const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

const TARGET = 'https://tdjqtbnacgpisuefruva.supabase.co';

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Health check ABOVE the proxy so it's not forwarded
app.get('/health', (_, res) => res.send('ok'));

// Handle preflight
app.options('*', (req, res) => {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  res.sendStatus(204);
});

// Debug: log every request before proxying
app.use((req, res, next) => {
  console.log(`[PROXY] ${req.method} ${req.originalUrl}`);
  next();
});

// Proxy ALL paths with NO path rewriting
app.use(createProxyMiddleware({
  target: TARGET,
  changeOrigin: true,
  onProxyReq(proxyReq, req) {
    // Force the exact original path
    proxyReq.path = req.originalUrl;
    console.log(`[PROXY] Forwarding to: ${TARGET}${proxyReq.path}`);
  },
  onProxyRes(proxyRes) {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => {
      proxyRes.headers[k] = v;
    });
  },
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy listening on ${PORT}`));

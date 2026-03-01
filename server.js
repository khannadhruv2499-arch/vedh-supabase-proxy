const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const TARGET = 'https://tdjqtbnacgpisuefruva.supabase.co';
const CORS_HEADERS = {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version',
    'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

app.options('*', (req, res) => {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    res.sendStatus(204);
});

app.use('/functions', createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    onProxyRes(proxyRes) {
        Object.entries(CORS_HEADERS).forEach(([k, v]) => {
            proxyRes.headers[k] = v;
        });
    },
}));

app.get('/health', (_, res) => res.send('ok'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy listening on ${PORT}`));
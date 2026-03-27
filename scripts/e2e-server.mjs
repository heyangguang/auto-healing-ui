import express from 'express';
import path from 'node:path';

const app = express();
const port = Number(process.env.E2E_PORT || 3100);
const distDir = path.resolve(process.cwd(), 'dist');

app.use(express.static(distDir, { extensions: ['html'] }));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, () => {
  process.stdout.write(`[e2e-server] serving ${distDir} on http://127.0.0.1:${port}\n`);
});

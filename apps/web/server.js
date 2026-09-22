import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

app.use(express.static(publicDir));

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'supreme-intelligence-web' });
});

app.listen(PORT, () => {
  console.log(`Web app running on http://localhost:${PORT}`);
});

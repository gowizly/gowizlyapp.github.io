import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Needed to replace __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// --- API example ---
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express API' });
});

// --- Serve React build ---
const buildPath = path.join(__dirname, '../../frontend/build');
app.use(express.static(buildPath));

// SPA Fallback (for React Router)
// Catch-all route (React Router fallback)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});


app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

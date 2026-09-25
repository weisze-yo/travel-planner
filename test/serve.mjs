// A static server with the same rewrite Firebase Hosting does: anything that
// is not a file falls through to index.html. Without it /j/CODE is a 404 and
// the one screen a stranger ever sees cannot be tested at all.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolved from this file rather than hardcoded, so the suite runs on a
// laptop and on a CI runner as well as in the development container.
const ROOT = join(dirname(dirname(fileURLToPath(import.meta.url))), 'web');
const PORT = Number(process.env.TP_SPA_PORT || 8123);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  let path = join(ROOT, normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, ''));
  try {
    const info = await stat(path);
    if (info.isDirectory()) path = join(path, 'index.html');
  } catch {
    // Hosting's rewrite is for ROUTES — /j/CODE must serve the app. It is not
    // for missing assets, and treating them the same is actively misleading:
    // before this, a missing `js/app.js` returned index.html with a 200, so the
    // browser was handed HTML where it expected a module and the only symptom
    // was a boot that never finished. That is exactly how a forgotten
    // `npm run build` presented itself in CI — as a 30-second timeout with no
    // hint of a cause. Anything with a file extension now 404s and says why.
    if (extname(path)) {
      res.writeHead(404, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' });
      res.end(`not found: ${url.pathname}\n\n`
        + (url.pathname.startsWith('/js/')
          ? 'web/js/ is build output and is not in git. Run: npm run build\n'
          : ''));
      return;
    }
    path = join(ROOT, 'index.html');
  }
  try {
    const body = await readFile(path);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(path)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch (e) {
    res.writeHead(404); res.end('not found');
  }
}).listen(PORT, '127.0.0.1', () => console.log(`serving ${ROOT} on ${PORT} with SPA fallback`));

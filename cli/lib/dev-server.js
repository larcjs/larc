/**
 * Development Server with Hot Reload
 */

import { createServer } from 'http';
import { readFile, readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { watch } from 'chokidar';
import chalk from 'chalk';
import { exec } from 'child_process';

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const clients = new Set();

export async function startDevServer(options) {
  const port = parseInt(options.port) || 3000;
  const hot = options.hot !== false;
  const openBrowser = options.open !== false;
  const prod = options.prod || false;

  console.log(chalk.bold.blue(`\n🚀 Starting ${prod ? 'preview' : 'development'} server\n`));

  // Create HTTP server
  const server = createServer(async (req, res) => {
    // SSE endpoint for hot reload
    if (req.url === '/__larc_hmr') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      clients.add(res);

      req.on('close', () => {
        clients.delete(res);
      });

      return;
    }

    // Serve files - sanitize path to prevent directory traversal
    const requestPath = req.url === '/' ? 'index.html' : req.url.split('?')[0];
    // Resolve and verify path stays within cwd
    const cwd = process.cwd();
    let filePath = join(cwd, requestPath);
    const resolvedPath = require('path').resolve(filePath);
    if (!resolvedPath.startsWith(cwd)) {
      res.writeHead(403);
      res.end('403 Forbidden');
      logRequest(req.url, 403);
      return;
    }

    // Handle larc.config.json -> generate importmap
    if (req.url === '/importmap.json') {
      try {
        const config = JSON.parse(await readFile(join(process.cwd(), 'larc.config.json'), 'utf-8'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(config.importmap || { imports: {} }));
        logRequest(req.url, 200);
        return;
      } catch (err) {
        res.writeHead(404);
        res.end('larc.config.json not found');
        logRequest(req.url, 404);
        return;
      }
    }

    try {
      const fileStat = await stat(filePath);

      // If directory, serve index.html
      if (fileStat.isDirectory()) {
        filePath = join(filePath, 'index.html');
      }

      let content = await readFile(filePath);
      const ext = extname(filePath);
      const contentType = MIME_TYPES[ext] || 'text/plain';

      // Inject HMR client for HTML files
      if (hot && !prod && ext === '.html') {
        const hmrClient = `
<script>
  const evtSource = new EventSource('/__larc_hmr');
  evtSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'reload') {
      console.log('[LARC HMR] Reloading...');
      window.location.reload();
    }
  };
  console.log('[LARC HMR] Connected');
</script>`;
        content = content.toString().replace('</body>', `${hmrClient}\n</body>`);
      }

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);

      logRequest(req.url, 200);

    } catch (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('404 Not Found');
        logRequest(req.url, 404);
      } else {
        res.writeHead(500);
        res.end('500 Internal Server Error');
        logRequest(req.url, 500);
      }
    }
  });

  // Start server
  server.listen(port, () => {
    const url = `http://localhost:${port}`;

    console.log(chalk.gray(`  Local:    ${chalk.cyan(url)}`));
    console.log(chalk.gray(`  Network:  ${chalk.cyan(`http://0.0.0.0:${port}`)}\n`));

    if (hot && !prod) {
      console.log(chalk.gray(`  ${chalk.green('✓')} Hot reload enabled\n`));
    }

    console.log(chalk.gray('  Press Ctrl+C to stop\n'));

    // Open browser
    if (openBrowser) {
      const command = process.platform === 'darwin' ? 'open' :
                     process.platform === 'win32' ? 'start' : 'xdg-open';
      exec(`${command} ${url}`);
    }
  });

  // Watch for file changes
  if (hot && !prod) {
    const watcher = watch([
      'src/**/*',
      'public/**/*',
      '*.html',
      '*.css',
      'larc.config.json'
    ], {
      ignoreInitial: true,
      ignored: ['**/node_modules/**', '**/.git/**']
    });

    watcher.on('change', (path) => {
      console.log(chalk.gray(`  ${new Date().toLocaleTimeString()} ${chalk.yellow('changed')} ${path}`));
      notifyClients({ type: 'reload', path });
    });

    watcher.on('add', (path) => {
      console.log(chalk.gray(`  ${new Date().toLocaleTimeString()} ${chalk.green('added')} ${path}`));
      notifyClients({ type: 'reload', path });
    });

    watcher.on('unlink', (path) => {
      console.log(chalk.gray(`  ${new Date().toLocaleTimeString()} ${chalk.red('removed')} ${path}`));
      notifyClients({ type: 'reload', path });
    });
  }
}

function logRequest(url, status) {
  const color = status < 300 ? 'green' : status < 400 ? 'yellow' : 'red';
  console.log(chalk.gray(`  ${new Date().toLocaleTimeString()} ${chalk[color](status)} ${url}`));
}

function notifyClients(data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => {
    try {
      client.write(message);
    } catch (err) {
      clients.delete(client);
    }
  });
}

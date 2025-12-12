#!/usr/bin/env node
/**
 * Simple dev server for the registry browser
 */

import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const publicDir = join(__dirname, '../public');
const port = process.env.PORT || 3000;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = createServer(async (req, res) => {
  const requestPath = req.url === '/' ? 'index.html' : req.url.split('?')[0];

  // Sanitize path to prevent directory traversal
  let filePath;
  if (req.url === '/registry.json') {
    filePath = join(__dirname, '../registry.json');
  } else {
    filePath = join(publicDir, requestPath);
    // Resolve and verify path stays within publicDir
    const { resolve } = await import('path');
    const resolvedPath = resolve(filePath);
    if (!resolvedPath.startsWith(publicDir)) {
      res.writeHead(403);
      res.end('403 Forbidden');
      console.log(chalk.gray(`${new Date().toLocaleTimeString()} ${chalk.red('403')} ${req.url}`));
      return;
    }
  }

  try {
    const content = await readFile(filePath);
    const ext = extname(filePath);
    const contentType = mimeTypes[ext] || 'text/plain';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);

    console.log(chalk.gray(`${new Date().toLocaleTimeString()} ${chalk.green('200')} ${req.url}`));
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404);
      res.end('404 Not Found');
      console.log(chalk.gray(`${new Date().toLocaleTimeString()} ${chalk.red('404')} ${req.url}`));
    } else {
      res.writeHead(500);
      res.end('500 Internal Server Error');
      console.log(chalk.gray(`${new Date().toLocaleTimeString()} ${chalk.red('500')} ${req.url}`));
    }
  }
});

server.listen(port, () => {
  console.log(chalk.bold.blue('\n🚀 LARC Registry Dev Server\n'));
  console.log(chalk.gray(`  Local:   ${chalk.cyan(`http://localhost:${port}`)}`));
  console.log(chalk.gray(`  Network: ${chalk.cyan(`http://0.0.0.0:${port}`)}\n`));
  console.log(chalk.gray('  Press Ctrl+C to stop\n'));
});

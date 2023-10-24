// required until Deno v2
// https://github.com/denoland/deno/issues/13367
import 'data:text/javascript,delete globalThis.window;';

import { renderToWebStream } from 'vue/server-renderer';
import app, { router } from './src/app.js';

// use importmap from deno.json
const config = await Deno.readTextFile('./deno.json');
const importmap = { imports: JSON.parse(config).imports };

Deno.serve(async (request) => {
  const url = new URL(request.url, 'http://localhost');

  // quick js file server
  const static_path = './src';
  const filePath = static_path + url.pathname;
  let file;
  try {
    file = await Deno.readFile(filePath);
  } catch {
    // ignore
  }
  if (file) {
    return new Response(file, {
      headers: { 'content-type': 'text/javascript' },
    });
  }

  if (url.pathname === '/favicon.ico') {
    return new Response(null, { status: 404 });
  }

  app.provide('importmap', JSON.stringify(importmap));
  router.push(new URL(request.url).pathname);
  const stream = await router.isReady().then(() => renderToWebStream(app));

  return new Response(stream, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
});

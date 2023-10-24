// @ts-check

// required until Deno v2
// https://github.com/denoland/deno/issues/13367
import 'data:text/javascript,delete globalThis.window;';

import { renderToWebStream } from 'vue/server-renderer';
import { createRouter, createMemoryHistory } from 'vue-router';
import app, { routes } from './src/app.js';

// minify js
import minify from 'npm:@node-minify/core';
import uglifyjs from 'npm:@node-minify/uglify-js';

// preload headers
import resolveLinkRelations from 'npm:modulepreload-link-relations/resolveLinkRelations.mjs';
import formatLinkHeaderRelations from 'npm:modulepreload-link-relations/formatLinkHeaderRelations.mjs';

// use importmap from deno.json
const config = await Deno.readTextFile('./deno.json');
const importmap = { imports: JSON.parse(config).imports };

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});
app.use(router);
app.provide('importmap', JSON.stringify(importmap));

const appPath = './src';

Deno.serve(async (request) => {
  const url = new URL(request.url, 'http://localhost');

  // quick js file server
  const static_path = './src';
  const filePath = static_path + url.pathname;
  let file;
  try {
    file = await Deno.readTextFile(filePath);
  } catch {
    // ignore
  }
  if (file) {
    // @ts-ignore missing types from minify lib
    file = await minify({
      compressor: uglifyjs,
      content: file,
    });
    const linkRelations = await resolveLinkRelations({
      appPath,
      url: filePath.replace(appPath, ''),
    });

    /** @type {Object.<string, string>} */
    const headers = {
      'content-type': 'text/javascript',
    };
    if (linkRelations) {
      headers.link = formatLinkHeaderRelations(linkRelations);
    }
    return new Response(file, { headers });
  }

  if (url.pathname === '/favicon.ico') {
    return new Response(null, { status: 404 });
  }

  await router.push(new URL(request.url).pathname);

  const stream = renderToWebStream(app);

  return new Response(stream, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
  });
});

#!/usr/bin/env node
import t from"fs";import a from"path";import{fileURLToPath as f}from"url";const h=a.dirname(f(import.meta.url)),m=a.join(h,".."),u=a.join(m,"tests"),s=a.join(u,"playwright"),o=a.join(u,"fixtures"),y=["drag-drop-list","editable-cell","file-upload","pan-card","pan-chart","pan-date-picker","pan-dropdown","pan-link","pan-markdown-editor","pan-markdown-renderer","pan-modal","pan-pagination","pan-search-bar","pan-table","pan-tabs","pan-theme-toggle","pan-tree","todo-list","user-avatar","x-counter"],x=["pan-auth","pan-computed-state","pan-data-connector","pan-data-provider","pan-data-provider-mock","pan-data-table","pan-fetch","pan-files","pan-form","pan-forwarder","pan-graphql-connector","pan-idb","pan-invoice-store","pan-json-form","pan-jwt","pan-leaflet-map","pan-offline-sync","pan-open-data-connector","pan-persistence-strategy","pan-php-connector","pan-query","pan-router","pan-routes","pan-schema","pan-schema-form","pan-schema-validator","pan-security","pan-sse","pan-state-sync","pan-static-connector","pan-storage","pan-store","pan-store-pan","pan-theme-provider","pan-undo-redo","pan-validation","pan-websocket","pan-worker","todo-provider"];function b(e){return!e.startsWith("pan-bus")&&e!=="pan-client"}function w(e){const n=b(e);return`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>LARC UI Test – ${e}</title>${n?`
    <script type="module" src="../../../core/pan-bus.mjs"><\/script>
    <script type="module" src="../../../core/pan-client.mjs"><\/script>`:""}
    <script type="module" src="../../${e}.mjs"><\/script>
    <style>
      body {
        font-family: sans-serif;
        padding: 2rem;
      }
    </style>
  </head>
  <body>${n?`
    <pan-bus debug="true"></pan-bus>`:""}
    <${e}></${e}>
  </body>
</html>
`}function $(e){return`import { test, expect } from '@playwright/test';

const fixturePath = '/packages/ui/tests/fixtures/${e}.html';

test.describe('${e} component', () => {
  test('registers and renders without errors', async ({ page }) => {
    await page.goto(fixturePath);

    // Wait for custom element to be defined
    await page.waitForFunction(() => customElements.get('${e}'));

    // Check that element exists in DOM
    const element = await page.locator('${e}');
    await expect(element).toBeAttached();

    // Check for JavaScript errors
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Give component time to initialize
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });
});
`}const i=t.existsSync(s)?t.readdirSync(s).filter(e=>e.endsWith(".spec.mjs")):[],p=t.existsSync(o)?t.readdirSync(o).filter(e=>e.endsWith(".html")):[];console.log(`Found ${i.length} existing specs and ${p.length} existing fixtures`);[s,o].forEach(e=>{t.existsSync(e)||(t.mkdirSync(e,{recursive:!0}),console.log(`Created directory: ${e}`))});let c=0,l=0;[...y,...x].forEach(e=>{const n=`${e}.spec.mjs`,r=`${e}.html`,d=a.join(s,n),g=a.join(o,r);if(i.includes(n)&&p.includes(r)){l++;return}i.includes(n)||(t.writeFileSync(d,$(e)),console.log(`✓ Generated spec: ${n}`),c++),p.includes(r)||(t.writeFileSync(g,w(e)),console.log(`✓ Generated fixture: ${r}`))});console.log(`
Generation complete:`);console.log(`  - Generated: ${c} new test files`);console.log(`  - Skipped: ${l} existing test files`);console.log(`  - Total components with tests: ${c+l}`);

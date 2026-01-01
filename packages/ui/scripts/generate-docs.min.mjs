#!/usr/bin/env node
import a from"fs";import l from"path";import{fileURLToPath as w}from"url";const y=w(import.meta.url),f=l.dirname(y),b=l.join(f,"../src/ui"),m=l.join(f,"../docs"),u=l.join(m,"components.html");function $(o){const t={tag:"",description:"",attributes:[],topics:{subscribes:[],publishes:[]},slots:[],examples:[]},e=o.match(/\/\/\s*<([\w-]+)>|@element\s+([\w-]+)/);if(e&&(t.tag=e[1]||e[2]),!t.tag){const d=o.match(/export class (\w+) extends HTMLElement/);d&&(t.tag=d[1].replace(/([a-z])([A-Z])/g,"$1-$2").toLowerCase())}const s=o.match(/\/\/\s*<[\w-]+>\s*[—-]\s*(.+)|@element\s+[\w-]+\s*\n\s*\*\s*@extends[^\n]*\n\s*\*\s*\n\s*\*\s*(.+)/);s&&(t.description=(s[1]||s[2]||"").trim());const r=/\/\/\s*-\s*(\S+):\s*(.+)|@attr\s+\{[^}]+\}\s+(\S+)\s+-\s+(.+)/g;let i;for(;(i=r.exec(o))!==null;)t.attributes.push({name:i[1]||i[3],description:(i[2]||i[4]||"").trim()});const n=/\/\/\s*-\s*Subscribes?:\s*(.+)|@subscribes\s+(.+)/g;let c;for(;(c=n.exec(o))!==null;)t.topics.subscribes.push((c[1]||c[2]).trim());const x=/\/\/\s*-\s*Publishes?:\s*(.+)|@publishes\s+(.+)/g;let p;for(;(p=x.exec(o))!==null;)t.topics.publishes.push((p[1]||p[2]).trim());const T=/\/\/\s*-\s*(\w+):\s*(.+)|@slot\s+(\w+)\s+-\s+(.+)/g;let C;const g=o.match(/\/\/\s*Slots?:\s*([\s\S]*?)(?=\/\/\s*(?:Methods?|Usage|$)|@)/);return g&&g[1].split(`
`).forEach(v=>{const h=v.match(/\/\/\s*-\s*(\S+):\s*(.+)/);h&&t.slots.push({name:h[1],description:h[2].trim()})}),t}function S(o){if(!o.tag)return"";let t=`
    <div class="component" id="${o.tag}">
      <h2><code>&lt;${o.tag}&gt;</code></h2>
      <p class="description">${o.description||"No description available"}</p>
  `;return o.attributes.length>0&&(t+=`
      <h3>Attributes</h3>
      <table class="attr-table">
        <thead>
          <tr>
            <th>Attribute</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
    `,o.attributes.forEach(e=>{t+=`
          <tr>
            <td><code>${e.name}</code></td>
            <td>${e.description}</td>
          </tr>
      `}),t+=`
        </tbody>
      </table>
    `),(o.topics.subscribes.length>0||o.topics.publishes.length>0)&&(t+="<h3>PAN Topics</h3>",o.topics.subscribes.length>0&&(t+=`
      <h4>Subscribes</h4>
      <ul class="topic-list">
      `,o.topics.subscribes.forEach(e=>{t+=`<li><code>${e}</code></li>
`}),t+=`</ul>
`),o.topics.publishes.length>0&&(t+=`
      <h4>Publishes</h4>
      <ul class="topic-list">
      `,o.topics.publishes.forEach(e=>{t+=`<li><code>${e}</code></li>
`}),t+=`</ul>
`)),o.slots.length>0&&(t+=`
      <h3>Slots</h3>
      <ul class="slot-list">
    `,o.slots.forEach(e=>{t+=`<li><code>${e.name}</code> - ${e.description}</li>
`}),t+=`</ul>
`),t+=`
      <h3>Example</h3>
      <pre><code class="language-html">&lt;${o.tag}`,o.attributes.length>0&&(t+=`
  ${o.attributes[0].name}="value"`),t+=`&gt;&lt;/${o.tag}&gt;</code></pre>
    </div>
  `,t}function M(o){const t=o.map(s=>`<li><a href="#${s.tag}">&lt;${s.tag}&gt;</a></li>`).join(`
        `),e=o.map(s=>S(s)).join(`
`);return`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LARC Components Documentation</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }

    .container {
      display: grid;
      grid-template-columns: 280px 1fr;
      min-height: 100vh;
    }

    nav {
      background: #2c3e50;
      color: white;
      padding: 20px;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }

    nav h1 {
      font-size: 20px;
      margin-bottom: 20px;
      color: white;
    }

    nav ul {
      list-style: none;
    }

    nav li {
      margin: 8px 0;
    }

    nav a {
      color: #ecf0f1;
      text-decoration: none;
      font-size: 14px;
      display: block;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background 0.2s;
    }

    nav a:hover {
      background: rgba(255,255,255,0.1);
    }

    nav code {
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 13px;
    }

    main {
      padding: 40px;
      max-width: 1200px;
    }

    .component {
      background: white;
      padding: 30px;
      margin-bottom: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    h2 {
      color: #2c3e50;
      margin-bottom: 10px;
      font-size: 28px;
    }

    h3 {
      color: #34495e;
      margin-top: 24px;
      margin-bottom: 12px;
      font-size: 20px;
      border-bottom: 2px solid #3498db;
      padding-bottom: 4px;
    }

    h4 {
      color: #555;
      margin-top: 16px;
      margin-bottom: 8px;
      font-size: 16px;
    }

    .description {
      color: #666;
      font-size: 16px;
      margin-bottom: 20px;
    }

    code {
      background: #f8f9fa;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 14px;
      color: #e74c3c;
    }

    pre {
      background: #2c3e50;
      color: #ecf0f1;
      padding: 16px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 12px 0;
    }

    pre code {
      background: none;
      color: #ecf0f1;
      padding: 0;
    }

    .attr-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
    }

    .attr-table th,
    .attr-table td {
      text-align: left;
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }

    .attr-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: #2c3e50;
    }

    .attr-table tr:hover {
      background: #f8f9fa;
    }

    .topic-list,
    .slot-list {
      list-style: none;
      padding-left: 0;
    }

    .topic-list li,
    .slot-list li {
      padding: 6px 0;
      border-bottom: 1px solid #ecf0f1;
    }

    .topic-list li:last-child,
    .slot-list li:last-child {
      border-bottom: none;
    }

    @media (max-width: 768px) {
      .container {
        grid-template-columns: 1fr;
      }

      nav {
        position: relative;
        height: auto;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <nav>
      <h1>LARC Components</h1>
      <ul>
        ${t}
      </ul>
    </nav>

    <main>
      <h1 style="margin-bottom: 30px;">Component Documentation</h1>
      ${e}
    </main>
  </div>
</body>
</html>
`}function k(){console.log(`📚 Generating component documentation...
`),a.existsSync(m)||a.mkdirSync(m,{recursive:!0});const o=a.readdirSync(b).filter(s=>s.endsWith(".mjs")).sort(),t=[];o.forEach(s=>{const r=l.join(b,s),i=a.readFileSync(r,"utf8"),n=$(i);n.tag?(t.push(n),console.log(`✅ Parsed ${s} -> <${n.tag}>`)):console.log(`⚠️  Skipped ${s} - no tag found`)});const e=M(t);a.writeFileSync(u,e,"utf8"),console.log(`
✨ Documentation generated: ${u}`),console.log(`📊 Total components documented: ${t.length}`)}k();

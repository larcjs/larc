#!/usr/bin/env node
import p from"fs";import d from"path";import{fileURLToPath as C}from"url";const z=C(import.meta.url),w=d.dirname(z),y=d.join(w,"../src/ui"),u=d.join(w,"../docs"),v=d.join(u,"components.html"),T={"Data & State":["store","data-provider","data-connector","idb","query"],"Forms & Input":["form","dropdown","date-picker","search-bar","file-upload","editable-cell"],"Data Display":["table","chart","pagination","card","tree"],Navigation:["router","link","tabs"],"Dialogs & Overlays":["modal"],"Layout & UI":["theme-provider","theme-toggle"],"API & Connectivity":["fetch","websocket","sse","graphql-connector","php-connector"],"Auth & Security":["auth","jwt","security","validation"],Content:["markdown-editor","markdown-renderer"],"Dev Tools":["inspector","forwarder"],Utilities:["worker","files","schema","schema-form"],Specialized:["invoice-store","todo-list","todo-provider","user-avatar"],"UI Components":["drag-drop-list","x-counter"]};function j(e){const s=e.replace("pan-","");for(const[t,o]of Object.entries(T))for(const a of o)if(s.includes(a)||e.includes(a))return t;return"Other"}function O(e,s){const t={tag:"",category:"",description:"",status:"stable",since:"",attributes:[],topics:{subscribes:[],publishes:[]},slots:[],methods:[],events:[],examples:[],related:[],notes:[]},o=e.match(/\/\/\s*<([\w-]+)>|@element\s+([\w-]+)|\*\s*@component\s+([\w-]+)/);if(o&&(t.tag=o[1]||o[2]||o[3]),!t.tag){const l=e.match(/export class (\w+) extends HTMLElement/);l&&(t.tag=l[1].replace(/([a-z])([A-Z])/g,"$1-$2").toLowerCase())}t.tag&&(t.category=j(t.tag));const a=e.match(/@category\s+(.+)/);a&&(t.category=a[1].trim());const n=e.match(/@status\s+(stable|beta|experimental|deprecated)/);n&&(t.status=n[1]);const r=e.match(/@since\s+([\d.]+)/);r&&(t.since=r[1]);const i=e.match(/\/\/\s*<[\w-]+>\s*[—-]\s*(.+)|@description\s+(.+)|\*\s*(.+?)\s*\n\s*\*\s*\n\s*\*\s*@/);i&&(t.description=(i[1]||i[2]||i[3]||"").trim());const $=/\/\/\s*-\s*(\S+):\s*(.+)|@attr(?:ibute)?\s+(?:\{([^}]+)\}\s+)?(\S+)\s+-?\s*(.+)/g;let c;for(;(c=$.exec(e))!==null;)t.attributes.push({name:c[1]||c[4],type:c[3]||"string",description:(c[2]||c[5]||"").trim()});const k=/\/\/\s*-\s*Subscribes?:\s*(.+)|@subscribes?\s+(.+)/g;let g;for(;(g=k.exec(e))!==null;)t.topics.subscribes.push((g[1]||g[2]).trim());const S=/\/\/\s*-\s*Publishes?:\s*(.+)|@publishes?\s+(.+)/g;let h;for(;(h=S.exec(e))!==null;)t.topics.publishes.push((h[1]||h[2]).trim());const f=e.match(/\/\/\s*Slots?:\s*([\s\S]*?)(?=\/\/\s*(?:Methods?|Topics?|Usage|$)|@)/);f&&f[1].split(`
`).forEach(E=>{const b=E.match(/\/\/\s*-\s*(\S+):\s*(.+)/);b&&t.slots.push({name:b[1],description:b[2].trim()})});const x=e.match(/@related\s+(.+)/);x&&(t.related=x[1].split(",").map(l=>l.trim()));const M=/@example\s*\n\s*\*?\s*```(\w+)?\s*\n([\s\S]*?)```/g;let m;for(;(m=M.exec(e))!==null;)t.examples.push({language:m[1]||"html",code:m[2].replace(/^\s*\*\s?/gm,"").trim()});return t}function D(e){if(!e.tag)return"";const s={stable:'<span class="badge badge-stable">Stable</span>',beta:'<span class="badge badge-beta">Beta</span>',experimental:'<span class="badge badge-experimental">Experimental</span>',deprecated:'<span class="badge badge-deprecated">Deprecated</span>'}[e.status]||"";let t=`
    <div class="component" id="${e.tag}">
      <div class="component-header">
        <h2><code>&lt;${e.tag}&gt;</code></h2>
        <div class="badges">
          ${s}
          ${e.since?`<span class="badge badge-info">Since ${e.since}</span>`:""}
        </div>
      </div>
      <p class="description">${e.description||"No description available"}</p>
  `;return e.related.length>0&&(t+=`
      <div class="related">
        <strong>Related:</strong> ${e.related.map(o=>`<a href="#${o}"><code>${o}</code></a>`).join(", ")}
      </div>
    `),e.attributes.length>0&&(t+=`
      <h3>Attributes</h3>
      <table class="attr-table">
        <thead>
          <tr>
            <th>Attribute</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
    `,e.attributes.forEach(o=>{t+=`
          <tr>
            <td><code>${o.name}</code></td>
            <td><code>${o.type}</code></td>
            <td>${o.description}</td>
          </tr>
      `}),t+=`
        </tbody>
      </table>
    `),(e.topics.subscribes.length>0||e.topics.publishes.length>0)&&(t+="<h3>PAN Topics</h3>",e.topics.subscribes.length>0&&(t+=`
      <h4>📥 Subscribes</h4>
      <ul class="topic-list">
      `,e.topics.subscribes.forEach(o=>{t+=`<li><code>${o}</code></li>
`}),t+=`</ul>
`),e.topics.publishes.length>0&&(t+=`
      <h4>📤 Publishes</h4>
      <ul class="topic-list">
      `,e.topics.publishes.forEach(o=>{t+=`<li><code>${o}</code></li>
`}),t+=`</ul>
`)),e.slots.length>0&&(t+=`
      <h3>Slots</h3>
      <ul class="slot-list">
    `,e.slots.forEach(o=>{t+=`<li><code>${o.name}</code> - ${o.description}</li>
`}),t+=`</ul>
`),e.examples.length>0?(t+="<h3>Examples</h3>",e.examples.forEach((o,a)=>{t+=`<pre><code class="language-${o.language}">${R(o.code)}</code></pre>`})):(t+=`
      <h3>Example</h3>
      <pre><code class="language-html">&lt;${e.tag}`,e.attributes.length>0&&(t+=`
  ${e.attributes[0].name}="value"`),t+=`&gt;&lt;/${e.tag}&gt;</code></pre>
    `),t+=`</div>
`,t}function R(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function L(e){let s="";for(const[o,a]of Object.entries(e).sort())a.length!==0&&(s+=`
      <div class="nav-category">
        <h3>${o}</h3>
        <ul>
    `,a.forEach(n=>{s+=`          <li><a href="#${n.tag}"><code>&lt;${n.tag}&gt;</code></a></li>
`}),s+=`        </ul>
      </div>
`);let t="";for(const[o,a]of Object.entries(e).sort())a.length!==0&&(t+=`
    <div class="category-section">
      <h1 class="category-title">${o}</h1>
    `,a.forEach(n=>{t+=D(n)}),t+=`</div>
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
      grid-template-columns: 300px 1fr;
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

    nav > h1 {
      font-size: 22px;
      margin-bottom: 20px;
      color: white;
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
    }

    .nav-category {
      margin-bottom: 24px;
    }

    .nav-category h3 {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #95a5a6;
      margin-bottom: 8px;
    }

    .nav-category ul {
      list-style: none;
    }

    .nav-category li {
      margin: 4px 0;
    }

    nav a {
      color: #ecf0f1;
      text-decoration: none;
      font-size: 13px;
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
      font-size: 12px;
    }

    main {
      padding: 40px;
      max-width: 1200px;
    }

    .category-section {
      margin-bottom: 60px;
    }

    .category-title {
      font-size: 32px;
      color: #2c3e50;
      margin-bottom: 30px;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
    }

    .component {
      background: white;
      padding: 30px;
      margin-bottom: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .component-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    h2 {
      color: #2c3e50;
      font-size: 28px;
    }

    .badges {
      display: flex;
      gap: 8px;
    }

    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge-stable {
      background: #27ae60;
      color: white;
    }

    .badge-beta {
      background: #f39c12;
      color: white;
    }

    .badge-experimental {
      background: #9b59b6;
      color: white;
    }

    .badge-deprecated {
      background: #e74c3c;
      color: white;
    }

    .badge-info {
      background: #3498db;
      color: white;
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
      line-height: 1.7;
    }

    .related {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 20px;
      font-size: 14px;
    }

    .related a {
      color: #3498db;
      text-decoration: none;
    }

    .related a:hover {
      text-decoration: underline;
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
      ${s}
    </nav>

    <main>
      ${t}
    </main>
  </div>
</body>
</html>
`}function P(){console.log(`📚 Generating categorized component documentation...
`),p.existsSync(u)||p.mkdirSync(u,{recursive:!0});const e=p.readdirSync(y).filter(a=>a.endsWith(".mjs")).sort(),s={};e.forEach(a=>{const n=d.join(y,a),r=p.readFileSync(n,"utf8"),i=O(r,a);i.tag?(s[i.category]||(s[i.category]=[]),s[i.category].push(i),console.log(`✅ Parsed ${a} -> <${i.tag}> [${i.category}]`)):console.log(`⚠️  Skipped ${a} - no tag found`)});for(const a of Object.keys(s))s[a].sort((n,r)=>n.tag.localeCompare(r.tag));const t=L(s);p.writeFileSync(v,t,"utf8");const o=Object.values(s).reduce((a,n)=>a+n.length,0);console.log(`
✨ Documentation generated: ${v}`),console.log(`📊 Total components: ${o}`),console.log(`📁 Categories: ${Object.keys(s).length}`),console.log(`
Components by category:`),Object.entries(s).sort().forEach(([a,n])=>{console.log(`  ${a}: ${n.length}`)})}P();

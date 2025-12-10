class c extends HTMLElement{static observedAttributes=["content","sanitize"];constructor(){super(),this.attachShadow({mode:"open"}),this._content="",this._sanitize=!0}connectedCallback(){this.render(),this._setupPanListeners()}attributeChangedCallback(r,e,d){r==="content"&&e!==d?(this._content=d||"",this.renderMarkdown()):r==="sanitize"&&(this._sanitize=d!=="false")}render(){this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: block;
        }

        .markdown-body {
          color: var(--color-text, #1e293b);
          line-height: 1.6;
          font-size: 1rem;
        }

        .markdown-body > *:first-child {
          margin-top: 0;
        }

        .markdown-body > *:last-child {
          margin-bottom: 0;
        }

        /* Headers */
        .markdown-body h1,
        .markdown-body h2,
        .markdown-body h3,
        .markdown-body h4,
        .markdown-body h5,
        .markdown-body h6 {
          margin: 1.5rem 0 1rem 0;
          font-weight: 600;
          line-height: 1.3;
          color: var(--color-text, #1e293b);
        }

        .markdown-body h1 { font-size: 2rem; border-bottom: 2px solid var(--color-border, #e2e8f0); padding-bottom: 0.5rem; }
        .markdown-body h2 { font-size: 1.5rem; border-bottom: 1px solid var(--color-border, #e2e8f0); padding-bottom: 0.5rem; }
        .markdown-body h3 { font-size: 1.25rem; }
        .markdown-body h4 { font-size: 1.1rem; }
        .markdown-body h5 { font-size: 1rem; }
        .markdown-body h6 { font-size: 0.9rem; color: var(--color-text-muted, #64748b); }

        /* Paragraphs */
        .markdown-body p {
          margin: 1rem 0;
        }

        /* Links */
        .markdown-body a {
          color: var(--color-primary, #006699);
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s;
        }

        .markdown-body a:hover {
          border-bottom-color: var(--color-primary, #006699);
        }

        /* Lists */
        .markdown-body ul,
        .markdown-body ol {
          margin: 1rem 0;
          padding-left: 2rem;
        }

        .markdown-body li {
          margin: 0.25rem 0;
        }

        .markdown-body li > p {
          margin: 0.5rem 0;
        }

        /* Task lists */
        .markdown-body input[type="checkbox"] {
          margin-right: 0.5rem;
        }

        /* Code */
        .markdown-body code {
          background: var(--color-code-bg, #1e293b);
          color: var(--color-code-text, #e2e8f0);
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-family: var(--font-mono, 'Courier New', monospace);
          font-size: 0.9em;
        }

        .markdown-body pre {
          background: var(--color-code-bg, #1e293b);
          color: var(--color-code-text, #e2e8f0);
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }

        .markdown-body pre code {
          background: none;
          padding: 0;
        }

        /* Blockquotes */
        .markdown-body blockquote {
          border-left: 4px solid var(--color-primary, #006699);
          padding-left: 1rem;
          margin: 1rem 0;
          color: var(--color-text-muted, #64748b);
          font-style: italic;
        }

        .markdown-body blockquote p {
          margin: 0.5rem 0;
        }

        /* Horizontal rule */
        .markdown-body hr {
          border: none;
          border-top: 2px solid var(--color-border, #e2e8f0);
          margin: 2rem 0;
        }

        /* Tables */
        .markdown-body table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }

        .markdown-body th,
        .markdown-body td {
          border: 1px solid var(--color-border, #e2e8f0);
          padding: 0.5rem 0.75rem;
          text-align: left;
        }

        .markdown-body th {
          background: var(--color-bg-alt, #f8fafc);
          font-weight: 600;
        }

        .markdown-body tr:hover {
          background: var(--color-bg-alt, #f8fafc);
        }

        /* Images */
        .markdown-body img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }

        /* Strong and emphasis */
        .markdown-body strong {
          font-weight: 600;
          color: var(--color-text, #1e293b);
        }

        .markdown-body em {
          font-style: italic;
        }

        /* Strikethrough */
        .markdown-body del {
          text-decoration: line-through;
          color: var(--color-text-muted, #64748b);
        }
      </style>
      <div class="markdown-body"></div>
    `,this.renderMarkdown()}renderMarkdown(){const r=this.shadowRoot.querySelector(".markdown-body");if(!r)return;const e=this._parseMarkdown(this._content);r.innerHTML=e}_parseMarkdown(r){if(!r)return"";let e=r;this._sanitize&&(e=this._escapeHtml(e)),e=e.replace(/```(\w+)?\n([\s\S]*?)```/g,(o,t,i)=>`<pre><code class="language-${t||"text"}">${i.trim()}</code></pre>`),e=e.replace(/^######\s+(.+)$/gm,"<h6>$1</h6>"),e=e.replace(/^#####\s+(.+)$/gm,"<h5>$1</h5>"),e=e.replace(/^####\s+(.+)$/gm,"<h4>$1</h4>"),e=e.replace(/^###\s+(.+)$/gm,"<h3>$1</h3>"),e=e.replace(/^##\s+(.+)$/gm,"<h2>$1</h2>"),e=e.replace(/^#\s+(.+)$/gm,"<h1>$1</h1>"),e=e.replace(/^(---|\*\*\*|___)$/gm,"<hr>"),e=e.replace(/^- \[([ x])\]\s+(.+)$/gm,(o,t,i)=>`<li><input type="checkbox" ${t==="x"?"checked":""} disabled>${i}</li>`),e=e.replace(/^[*+-]\s+(.+)$/gm,"<li>$1</li>"),e=e.replace(/(<li>.*<\/li>\n?)+/g,"<ul>$&</ul>"),e=e.replace(/^\d+\.\s+(.+)$/gm,"<li>$1</li>"),e=e.replace(/(<li>.*<\/li>\n?)+/g,o=>o.includes("<ul>")?o:`<ol>${o}</ol>`),e=e.replace(/^>\s+(.+)$/gm,"<blockquote><p>$1</p></blockquote>"),e=e.replace(/(<blockquote>.*<\/blockquote>\n?)+/g,o=>o.replace(/<\/blockquote>\n?<blockquote>/g,`
`)),e=this._parseTables(e),e=e.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),e=e.replace(/__(.+?)__/g,"<strong>$1</strong>"),e=e.replace(/\*(.+?)\*/g,"<em>$1</em>"),e=e.replace(/_(.+?)_/g,"<em>$1</em>"),e=e.replace(/~~(.+?)~~/g,"<del>$1</del>"),e=e.replace(/`([^`]+)`/g,"<code>$1</code>"),e=e.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>'),e=e.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img src="$2" alt="$1">');const d=e.split(`
`),n=[];let a=!1;for(let o of d){const t=o.trim();t.match(/^<(h[1-6]|ul|ol|blockquote|pre|table|hr)/)?(a=!0,n.push(o)):t.match(/<\/(ul|ol|blockquote|pre|table)>$/)?(n.push(o),a=!1):t===""?n.push(""):!a&&!t.match(/^</)&&!t.match(/<\/(li|th|td)>$/)?n.push(`<p>${t}</p>`):n.push(o)}return e=n.join(`
`),e}_parseTables(r){const e=r.split(`
`),d=[];let n=!1,a=[];for(let o=0;o<e.length;o++){const t=e[o].trim();if(t.match(/^\|.+\|$/)){const m=(e[o+1]?.trim()||"").match(/^\|[\s:-]+\|$/);if(!n&&m){n=!0;const s=t.slice(1,-1).split("|").map(l=>l.trim());a.push("<thead><tr>"+s.map(l=>`<th>${l}</th>`).join("")+"</tr></thead>"),o++,a.push("<tbody>")}else if(n){const s=t.slice(1,-1).split("|").map(l=>l.trim());a.push("<tr>"+s.map(l=>`<td>${l}</td>`).join("")+"</tr>")}else d.push(t)}else n&&(a.push("</tbody>"),d.push("<table>"+a.join(`
`)+"</table>"),a=[],n=!1),d.push(t)}return n&&(a.push("</tbody>"),d.push("<table>"+a.join(`
`)+"</table>")),d.join(`
`)}_escapeHtml(r){const e=document.createElement("div");return e.textContent=r,e.innerHTML}_setupPanListeners(){const r=document.querySelector("pan-bus");r&&r.subscribe("markdown.render",e=>{e.content!==void 0&&this.setContent(e.content)})}setContent(r){this._content=r||"",this.renderMarkdown()}getContent(){return this._content}getHtml(){return this.shadowRoot.querySelector(".markdown-body")?.innerHTML||""}}customElements.define("pan-markdown-renderer",c);var h=c;export{c as PanMarkdownRenderer,h as default};

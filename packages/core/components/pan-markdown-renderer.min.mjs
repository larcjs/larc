class p extends HTMLElement{static observedAttributes=["content","sanitize"];constructor(){super(),this.attachShadow({mode:"open"}),this._content="",this._sanitize=!0}connectedCallback(){this.render(),this._setupPanListeners()}attributeChangedCallback(t,e,r){t==="content"&&e!==r?(this._content=r||"",this.renderMarkdown()):t==="sanitize"&&(this._sanitize=r!=="false")}render(){this.shadowRoot.innerHTML=`
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
    `,this.renderMarkdown()}renderMarkdown(){const t=this.shadowRoot.querySelector(".markdown-body");if(!t)return;const e=this._parseMarkdown(this._content);t.innerHTML=e}_parseMarkdown(t){if(!t)return"";let e=t;this._sanitize&&(e=this._escapeHtml(e)),e=e.replace(/```(\w+)?\n([\s\S]*?)```/g,(s,n,d)=>`<pre><code class="language-${n||"text"}">${d.trim()}</code></pre>`),e=e.replace(/^######\s+(.+)$/gm,"<h6>$1</h6>"),e=e.replace(/^#####\s+(.+)$/gm,"<h5>$1</h5>"),e=e.replace(/^####\s+(.+)$/gm,"<h4>$1</h4>"),e=e.replace(/^###\s+(.+)$/gm,"<h3>$1</h3>"),e=e.replace(/^##\s+(.+)$/gm,"<h2>$1</h2>"),e=e.replace(/^#\s+(.+)$/gm,"<h1>$1</h1>"),e=e.replace(/^(---|\*\*\*|___)$/gm,"<hr>");const r=e.split(`
`),i=[];let o=0;for(;o<r.length;){const s=r[o];if(s.match(/^- \[([ x])\]/)){const n=[];for(;o<r.length&&r[o].match(/^- \[([ x])\]/);){const d=r[o].match(/^- \[([ x])\]\s+(.+)$/);if(d){const g=d[1]==="x"?"checked":"";n.push(`<li><input type="checkbox" ${g} disabled>${d[2]}</li>`)}o++}i.push("<ul>"+n.join(`
`)+"</ul>");continue}if(s.match(/^[*+-]\s+/)){const n=[];for(;o<r.length&&r[o].match(/^[*+-]\s+/);){const d=r[o].match(/^[*+-]\s+(.+)$/);d&&n.push(`<li>${d[1]}</li>`),o++}i.push("<ul>"+n.join(`
`)+"</ul>");continue}if(s.match(/^\d+\.\s+/)){const n=[];for(;o<r.length&&r[o].match(/^\d+\.\s+/);){const d=r[o].match(/^\d+\.\s+(.+)$/);d&&n.push(`<li>${d[1]}</li>`),o++}i.push("<ol>"+n.join(`
`)+"</ol>");continue}i.push(s),o++}e=i.join(`
`),e=e.replace(/^>\s+(.+)$/gm,"<blockquote><p>$1</p></blockquote>"),e=e.replace(/(<blockquote>.*<\/blockquote>\n?)+/g,s=>s.replace(/<\/blockquote>\n?<blockquote>/g,`
`)),e=this._parseTables(e),e=e.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),e=e.replace(/__(.+?)__/g,"<strong>$1</strong>"),e=e.replace(/\*(.+?)\*/g,"<em>$1</em>"),e=e.replace(/_(.+?)_/g,"<em>$1</em>"),e=e.replace(/~~(.+?)~~/g,"<del>$1</del>"),e=e.replace(/`([^`]+)`/g,"<code>$1</code>"),e=e.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>'),e=e.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img src="$2" alt="$1">');const m=e.split(`
`),a=[];let b=!1,h=[];const l=()=>{h.length>0&&(a.push(`<p>${h.join(" ")}</p>`),h=[])},c=/^<(h[1-6]|ul|ol|blockquote|pre|table|hr|div|section|article|header|footer|nav|aside)/,u=/<\/(ul|ol|blockquote|pre|table|div|section|article|header|footer|nav|aside)>$/;for(let s of m){const n=s.trim();n.match(c)?(l(),b=!0,a.push(s)):n.match(u)?(l(),a.push(s),b=!1):n.match(/^<li>/)||n.match(/<\/li>$/)?(l(),a.push(s)):n===""?(l(),a.push("")):b?a.push(s):h.push(n)}return l(),e=a.join(`
`),e}_parseTables(t){const e=t.split(`
`),r=[];let i=!1,o=[];for(let m=0;m<e.length;m++){const a=e[m].trim();if(a.match(/^\|.+\|$/)){const h=(e[m+1]?.trim()||"").match(/^\|[-:\s|]+\|$/);if(!i&&h){i=!0;const l=a.slice(1,-1).split("|").map(c=>c.trim());o.push("<thead><tr>"+l.map(c=>`<th>${c}</th>`).join("")+"</tr></thead>"),m++,o.push("<tbody>")}else if(i){const l=a.slice(1,-1).split("|").map(c=>c.trim());o.push("<tr>"+l.map(c=>`<td>${c}</td>`).join("")+"</tr>")}else r.push(a)}else i&&(o.push("</tbody>"),r.push("<table>"+o.join(`
`)+"</table>"),o=[],i=!1),r.push(a)}return i&&(o.push("</tbody>"),r.push("<table>"+o.join(`
`)+"</table>")),r.join(`
`)}_escapeHtml(t){const e=document.createElement("div");return e.textContent=t,e.innerHTML}_setupPanListeners(){const t=document.querySelector("pan-bus");t&&t.subscribe("markdown.render",e=>{e.content!==void 0&&this.setContent(e.content)})}setContent(t){this._content=t||"",this.renderMarkdown()}getContent(){return this._content}getHtml(){return this.shadowRoot.querySelector(".markdown-body")?.innerHTML||""}}customElements.define("pan-markdown-renderer",p);var f=p;export{p as PanMarkdownRenderer,f as default};

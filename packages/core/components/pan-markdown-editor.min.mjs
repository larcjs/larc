import"./pan-markdown-renderer.mjs";class d extends HTMLElement{static observedAttributes=["value","placeholder","preview","autosave"];constructor(){super(),this.attachShadow({mode:"open"}),this._value="",this._placeholder="Start writing...",this._showPreview=!1,this._autosave=!1,this._saveTimer=null}connectedCallback(){this.render(),this._setupEventListeners(),this._setupPanListeners()}disconnectedCallback(){this._saveTimer&&clearTimeout(this._saveTimer)}attributeChangedCallback(t,e,o){if(e!==o)switch(t){case"value":this._value=o||"",this._updateTextarea();break;case"placeholder":this._placeholder=o||"Start writing...",this._updateTextarea();break;case"preview":this._showPreview=o==="true",this.render(),this._setupEventListeners();break;case"autosave":this._autosave=o==="true";break}}render(){this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .editor-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-surface, #ffffff);
          border: 1px solid var(--color-border, #e2e8f0);
          border-radius: 0.5rem;
          overflow: hidden;
        }

        /* Toolbar */
        .toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          padding: 0.5rem;
          border-bottom: 1px solid var(--color-border, #e2e8f0);
          background: var(--color-bg-alt, #f8fafc);
        }

        .toolbar-group {
          display: flex;
          gap: 0.25rem;
          padding-right: 0.5rem;
          border-right: 1px solid var(--color-border, #e2e8f0);
        }

        .toolbar-group:last-child {
          border-right: none;
        }

        .toolbar-btn {
          background: var(--color-surface, #ffffff);
          border: 1px solid var(--color-border, #e2e8f0);
          color: var(--color-text, #1e293b);
          padding: 0.375rem 0.5rem;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.15s ease;
          font-family: var(--font-sans, system-ui);
        }

        .toolbar-btn:hover {
          background: var(--color-primary-soft, #e0f2fe);
          border-color: var(--color-primary, #006699);
        }

        .toolbar-btn:active {
          transform: scale(0.95);
        }

        .toolbar-btn.active {
          background: var(--color-primary, #006699);
          color: white;
          border-color: var(--color-primary, #006699);
        }

        /* Editor/Preview Layout */
        .content-area {
          display: flex;
          flex: 1;
          overflow: hidden;
        }

        .editor-pane,
        .preview-pane {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .editor-pane {
          border-right: ${this._showPreview?"1px solid var(--color-border, #e2e8f0)":"none"};
        }

        .pane-title {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted, #64748b);
          padding: 0.5rem 0.75rem;
          background: var(--color-bg-alt, #f8fafc);
          border-bottom: 1px solid var(--color-border, #e2e8f0);
        }

        .editor-textarea {
          flex: 1;
          width: 100%;
          padding: 1rem;
          border: none;
          outline: none;
          resize: none;
          font-family: var(--font-mono, 'Courier New', monospace);
          font-size: 0.95rem;
          line-height: 1.6;
          background: var(--color-surface, #ffffff);
          color: var(--color-text, #1e293b);
          tab-size: 2;
        }

        .editor-textarea::placeholder {
          color: var(--color-text-subtle, #94a3b8);
        }

        .preview-content {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
        }

        /* Footer */
        .editor-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          border-top: 1px solid var(--color-border, #e2e8f0);
          background: var(--color-bg-alt, #f8fafc);
          font-size: 0.75rem;
          color: var(--color-text-muted, #64748b);
        }

        .stats {
          display: flex;
          gap: 1rem;
        }

        .save-indicator {
          color: var(--color-success, #10b981);
        }

        @media (max-width: 768px) {
          .content-area {
            flex-direction: column;
          }

          .editor-pane {
            border-right: none;
            border-bottom: ${this._showPreview?"1px solid var(--color-border, #e2e8f0)":"none"};
          }
        }
      </style>

      <div class="editor-container">
        <div class="toolbar">
          <div class="toolbar-group">
            <button class="toolbar-btn" data-action="bold" title="Bold (Ctrl+B)"><strong>B</strong></button>
            <button class="toolbar-btn" data-action="italic" title="Italic (Ctrl+I)"><em>I</em></button>
            <button class="toolbar-btn" data-action="strikethrough" title="Strikethrough"><del>S</del></button>
          </div>

          <div class="toolbar-group">
            <button class="toolbar-btn" data-action="h1" title="Heading 1">H1</button>
            <button class="toolbar-btn" data-action="h2" title="Heading 2">H2</button>
            <button class="toolbar-btn" data-action="h3" title="Heading 3">H3</button>
          </div>

          <div class="toolbar-group">
            <button class="toolbar-btn" data-action="ul" title="Bullet List">• List</button>
            <button class="toolbar-btn" data-action="ol" title="Numbered List">1. List</button>
            <button class="toolbar-btn" data-action="task" title="Task List">☑ Task</button>
          </div>

          <div class="toolbar-group">
            <button class="toolbar-btn" data-action="link" title="Link (Ctrl+K)">🔗 Link</button>
            <button class="toolbar-btn" data-action="image" title="Image">🖼️ Image</button>
            <button class="toolbar-btn" data-action="code" title="Code">{ }</button>
            <button class="toolbar-btn" data-action="codeblock" title="Code Block">&lt;/&gt;</button>
          </div>

          <div class="toolbar-group">
            <button class="toolbar-btn" data-action="quote" title="Blockquote">❝ Quote</button>
            <button class="toolbar-btn" data-action="hr" title="Horizontal Rule">─</button>
            <button class="toolbar-btn" data-action="table" title="Table">⊞ Table</button>
          </div>

          <div class="toolbar-group">
            <button class="toolbar-btn ${this._showPreview?"active":""}" data-action="preview" title="Toggle Preview">👁️ Preview</button>
          </div>
        </div>

        <div class="content-area">
          <div class="editor-pane">
            <div class="pane-title">Markdown</div>
            <textarea class="editor-textarea" placeholder="${this._placeholder}">${this._value}</textarea>
          </div>

          ${this._showPreview?`
            <div class="preview-pane">
              <div class="pane-title">Preview</div>
              <div class="preview-content">
                <pan-markdown-renderer></pan-markdown-renderer>
              </div>
            </div>
          `:""}
        </div>

        <div class="editor-footer">
          <div class="stats">
            <span class="word-count">0 words</span>
            <span class="char-count">0 characters</span>
          </div>
          <div class="save-indicator"></div>
        </div>
      </div>
    `}_setupEventListeners(){const t=this.shadowRoot.querySelector(".editor-textarea"),e=this.shadowRoot.querySelector(".toolbar");t?.addEventListener("input",()=>{this._handleInput()}),t?.addEventListener("keydown",o=>{this._handleKeydown(o)}),e?.addEventListener("click",o=>{const a=o.target.closest(".toolbar-btn");if(a){const r=a.dataset.action;r&&this._handleToolbarAction(r)}}),this._updateStats(),this._updatePreview()}_setupPanListeners(){const t=document.querySelector("pan-bus");t&&(t.subscribe("markdown.set-content",e=>{e.content!==void 0&&this.setValue(e.content)}),t.subscribe("markdown.get-content",()=>{t.publish("markdown.content-response",{content:this._value})}))}_handleInput(){const t=this.shadowRoot.querySelector(".editor-textarea");this._value=t.value,this._updateStats(),this._updatePreview(),this._broadcastChange(),this._autosave&&this._debounceSave()}_handleKeydown(t){if(t.key==="Tab"){t.preventDefault(),this._insertText("  ");return}if(t.ctrlKey||t.metaKey)switch(t.key.toLowerCase()){case"b":t.preventDefault(),this._handleToolbarAction("bold");break;case"i":t.preventDefault(),this._handleToolbarAction("italic");break;case"k":t.preventDefault(),this._handleToolbarAction("link");break;case"s":t.preventDefault(),this._save();break}t.key==="Enter"&&this._handleEnter(t)}_handleEnter(t){const e=this.shadowRoot.querySelector(".editor-textarea"),o=e.selectionStart,a=e.value,r=a.lastIndexOf(`
`,o-1)+1,s=a.indexOf(`
`,o),i=a.substring(r,s===-1?a.length:s),n=i.match(/^(\s*)[*+-]\s/),l=i.match(/^(\s*)(\d+)\.\s/),c=i.match(/^(\s*)- \[([ x])\]\s/);if(n)t.preventDefault(),this._insertText(`
${n[1]}* `);else if(l){t.preventDefault();const h=parseInt(l[2])+1;this._insertText(`
${l[1]}${h}. `)}else c&&(t.preventDefault(),this._insertText(`
${c[1]}- [ ] `))}_handleToolbarAction(t){const o={bold:()=>this._wrapSelection("**","**"),italic:()=>this._wrapSelection("*","*"),strikethrough:()=>this._wrapSelection("~~","~~"),h1:()=>this._prefixLine("# "),h2:()=>this._prefixLine("## "),h3:()=>this._prefixLine("### "),ul:()=>this._prefixLine("* "),ol:()=>this._prefixLine("1. "),task:()=>this._prefixLine("- [ ] "),link:()=>this._insertLink(),image:()=>this._insertImage(),code:()=>this._wrapSelection("`","`"),codeblock:()=>this._insertCodeBlock(),quote:()=>this._prefixLine("> "),hr:()=>this._insertText(`
---
`),table:()=>this._insertTable(),preview:()=>this._togglePreview()}[t];o&&o()}_wrapSelection(t,e){const o=this.shadowRoot.querySelector(".editor-textarea"),a=o.selectionStart,r=o.selectionEnd,s=o.value,i=s.substring(a,r),n=s.substring(0,a)+t+i+e+s.substring(r);o.value=n,o.setSelectionRange(a+t.length,r+t.length),o.focus(),this._handleInput()}_prefixLine(t){const e=this.shadowRoot.querySelector(".editor-textarea"),o=e.selectionStart,a=e.value,r=a.lastIndexOf(`
`,o-1)+1,s=a.substring(0,r)+t+a.substring(r);e.value=s,e.setSelectionRange(o+t.length,o+t.length),e.focus(),this._handleInput()}_insertText(t){const e=this.shadowRoot.querySelector(".editor-textarea"),o=e.selectionStart,a=e.value;e.value=a.substring(0,o)+t+a.substring(o),e.setSelectionRange(o+t.length,o+t.length),e.focus(),this._handleInput()}_insertLink(){const t=prompt("Enter URL:");if(t){const e=prompt("Enter link text:")||t;this._insertText(`[${e}](${t})`)}}_insertImage(){const t=prompt("Enter image URL:");if(t){const e=prompt("Enter alt text:")||"image";this._insertText(`![${e}](${t})`)}}_insertCodeBlock(){const t=prompt("Enter language (optional):")||"";this._insertText(`\`\`\`${t}

\`\`\``)}_insertTable(){this._insertText(`
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`.trim())}_togglePreview(){this._showPreview=!this._showPreview,this.setAttribute("preview",this._showPreview.toString())}_updateStats(){const t=this._value.trim().split(/\s+/).filter(r=>r.length>0).length,e=this._value.length,o=this.shadowRoot.querySelector(".word-count"),a=this.shadowRoot.querySelector(".char-count");o&&(o.textContent=`${t} words`),a&&(a.textContent=`${e} characters`)}_updatePreview(){if(!this._showPreview)return;const t=this.shadowRoot.querySelector("pan-markdown-renderer");t&&t.setContent(this._value)}_updateTextarea(){const t=this.shadowRoot.querySelector(".editor-textarea");t&&t.value!==this._value&&(t.value=this._value,this._updateStats(),this._updatePreview())}_broadcastChange(){const t=document.querySelector("pan-bus");if(t){const e=this._value.trim().split(/\s+/).filter(a=>a.length>0).length,o=this._value.length;t.publish("markdown.changed",{content:this._value,wordCount:e,charCount:o})}}_debounceSave(){clearTimeout(this._saveTimer),this._saveTimer=setTimeout(()=>{this._save()},1e3)}_save(){const t=document.querySelector("pan-bus");t&&t.publish("markdown.saved",{content:this._value});const e=this.shadowRoot.querySelector(".save-indicator");e&&(e.textContent="Saved ✓",setTimeout(()=>{e.textContent=""},2e3))}setValue(t){this._value=t||"",this._updateTextarea()}getValue(){return this._value}insertText(t){this._insertText(t)}focus(){this.shadowRoot.querySelector(".editor-textarea")?.focus()}}customElements.define("pan-markdown-editor",d);var v=d;export{d as PanMarkdownEditor,v as default};

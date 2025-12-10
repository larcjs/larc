class n extends HTMLElement{static observedAttributes=["path","filter","show-hidden"];constructor(){super(),this.attachShadow({mode:"open"}),this._currentPath="/",this._filter="",this._showHidden=!1,this._files=[],this._rootHandle=null}async connectedCallback(){await this._initFileSystem(),this.render(),this._setupEventListeners(),this._setupPanListeners(),await this._loadFiles()}attributeChangedCallback(e,t,i){if(t!==i)switch(e){case"path":this._currentPath=i||"/",this._loadFiles();break;case"filter":this._filter=i||"",this._loadFiles();break;case"show-hidden":this._showHidden=i==="true",this._loadFiles();break}}async _initFileSystem(){try{this._rootHandle=await navigator.storage.getDirectory(),console.log("✓ OPFS initialized")}catch(e){console.error("Failed to initialize OPFS:",e)}}render(){this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: block;
          height: 100%;
        }

        .files-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-surface, #ffffff);
          border: 1px solid var(--color-border, #e2e8f0);
          border-radius: 0.5rem;
          overflow: hidden;
        }

        /* Header */
        .files-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          border-bottom: 1px solid var(--color-border, #e2e8f0);
          background: var(--color-bg-alt, #f8fafc);
        }

        .files-title {
          font-weight: 600;
          color: var(--color-text, #1e293b);
          font-size: 0.875rem;
        }

        .header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .icon-btn {
          background: var(--color-surface, #ffffff);
          border: 1px solid var(--color-border, #e2e8f0);
          color: var(--color-text, #1e293b);
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.15s ease;
        }

        .icon-btn:hover {
          background: var(--color-primary-soft, #e0f2fe);
          border-color: var(--color-primary, #006699);
        }

        /* Path breadcrumb */
        .path-breadcrumb {
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid var(--color-border, #e2e8f0);
          font-size: 0.75rem;
          color: var(--color-text-muted, #64748b);
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .breadcrumb-item {
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .breadcrumb-item:hover {
          color: var(--color-primary, #006699);
        }

        .breadcrumb-separator {
          color: var(--color-text-subtle, #94a3b8);
        }

        /* Search */
        .search-box {
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid var(--color-border, #e2e8f0);
        }

        .search-input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--color-border, #e2e8f0);
          border-radius: 0.25rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .search-input:focus {
          border-color: var(--color-primary, #006699);
        }

        /* File list */
        .files-list {
          flex: 1;
          overflow-y: auto;
          padding: 0.5rem;
        }

        .file-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 0.25rem;
          cursor: pointer;
          transition: background 0.15s ease;
          font-size: 0.875rem;
        }

        .file-item:hover {
          background: var(--color-bg-alt, #f8fafc);
        }

        .file-item.selected {
          background: var(--color-primary-soft, #e0f2fe);
          color: var(--color-primary, #006699);
        }

        .file-icon {
          font-size: 1.125rem;
        }

        .file-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-size {
          font-size: 0.75rem;
          color: var(--color-text-muted, #64748b);
        }

        .file-actions {
          display: none;
          gap: 0.25rem;
        }

        .file-item:hover .file-actions {
          display: flex;
        }

        .file-action-btn {
          background: transparent;
          border: none;
          color: var(--color-text-muted, #64748b);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          transition: all 0.15s ease;
        }

        .file-action-btn:hover {
          background: var(--color-surface, #ffffff);
          color: var(--color-primary, #006699);
        }

        /* Empty state */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--color-text-muted, #64748b);
          text-align: center;
          padding: 2rem;
        }

        .empty-state-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        /* Loading */
        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--color-text-muted, #64748b);
        }
      </style>

      <div class="files-container">
        <div class="files-header">
          <div class="files-title">📁 Files</div>
          <div class="header-actions">
            <button class="icon-btn" data-action="new-file" title="New File">📄 New</button>
            <button class="icon-btn" data-action="new-folder" title="New Folder">📁 New</button>
            <button class="icon-btn" data-action="refresh" title="Refresh">🔄</button>
          </div>
        </div>

        <div class="path-breadcrumb">
          <span class="breadcrumb-item" data-path="/">Home</span>
        </div>

        <div class="search-box">
          <input type="text" class="search-input" placeholder="Search files..." />
        </div>

        <div class="files-list">
          <div class="loading">Loading files...</div>
        </div>
      </div>
    `}_setupEventListeners(){this.shadowRoot.querySelector(".files-container").addEventListener("click",i=>{const r=i.target.closest("[data-action]");if(r){const s=r.dataset.action;this._handleAction(s)}const o=i.target.closest(".file-item");if(o){const s=o.dataset.path,l=o.dataset.isdir==="true";this._handleFileClick(s,l)}const a=i.target.closest(".file-action-btn");if(a){i.stopPropagation();const s=a.dataset.action,l=a.closest(".file-item").dataset.path;this._handleFileAction(s,l)}}),this.shadowRoot.querySelector(".search-input")?.addEventListener("input",i=>{this._filterFiles(i.target.value)})}_setupPanListeners(){const e=document.querySelector("pan-bus");e&&(e.subscribe("file.save",async t=>{t.path&&t.content!==void 0&&await this.writeFile(t.path,t.content)}),e.subscribe("file.load",async t=>{if(t.path){const i=await this.readFile(t.path);e.publish("file.content-loaded",{path:t.path,content:i})}}),e.subscribe("file.delete",async t=>{t.path&&await this.deleteFile(t.path)}),e.subscribe("file.create",async t=>{t.path&&await this.writeFile(t.path,t.content||"")}))}async _loadFiles(){if(!this._rootHandle)return;const e=this.shadowRoot.querySelector(".files-list");if(e)try{const t=[];for await(const i of this._rootHandle.values()){const r=i.kind==="directory",o=i.name;if(this._filter&&!r){const s=o.substring(o.lastIndexOf("."));if(!this._filter.split(",").includes(s))continue}if(!this._showHidden&&o.startsWith("."))continue;let a=0;if(!r)try{a=(await i.getFile()).size}catch(s){console.warn("Could not get file size:",s)}t.push({name:o,path:"/"+o,isDirectory:r,size:a,entry:i})}t.sort((i,r)=>i.isDirectory!==r.isDirectory?i.isDirectory?-1:1:i.name.localeCompare(r.name)),this._files=t,this._renderFiles(t)}catch(t){console.error("Failed to load files:",t),e.innerHTML='<div class="empty-state"><div class="empty-state-icon">⚠️</div><div>Failed to load files</div></div>'}}_renderFiles(e){const t=this.shadowRoot.querySelector(".files-list");if(t){if(e.length===0){t.innerHTML=`
        <div class="empty-state">
          <div class="empty-state-icon">📂</div>
          <div>No files yet</div>
          <div style="font-size: 0.875rem; margin-top: 0.5rem;">Click "New" to create a file</div>
        </div>
      `;return}t.innerHTML=e.map(i=>{const r=i.isDirectory?"📁":this._getFileIcon(i.name),o=i.isDirectory?"":this._formatSize(i.size);return`
        <div class="file-item" data-path="${i.path}" data-isdir="${i.isDirectory}">
          <span class="file-icon">${r}</span>
          <span class="file-name">${i.name}</span>
          <span class="file-size">${o}</span>
          <div class="file-actions">
            <button class="file-action-btn" data-action="rename" title="Rename">✏️</button>
            <button class="file-action-btn" data-action="delete" title="Delete">🗑️</button>
          </div>
        </div>
      `}).join("")}}_filterFiles(e){if(!e.trim()){this._renderFiles(this._files);return}const t=this._files.filter(i=>i.name.toLowerCase().includes(e.toLowerCase()));this._renderFiles(t)}_handleAction(e){switch(e){case"new-file":this._createNewFile();break;case"new-folder":this._createNewFolder();break;case"refresh":this._loadFiles();break}}async _createNewFile(){const e=prompt("Enter file name:");if(!e)return;await this.writeFile("/"+e,""),await this._loadFiles();const t=document.querySelector("pan-bus");t&&t.publish("file.created",{path:"/"+e,name:e})}async _createNewFolder(){const e=prompt("Enter folder name:");if(e)try{await this._rootHandle.getDirectoryHandle(e,{create:!0}),await this._loadFiles();const t=document.querySelector("pan-bus");t&&t.publish("file.created",{path:"/"+e,name:e,isDirectory:!0})}catch(t){console.error("Failed to create folder:",t),alert("Failed to create folder")}}_handleFileClick(e,t){if(t){console.log("Navigate to:",e);return}this._selectFile(e);const i=document.querySelector("pan-bus");i&&i.publish("file.selected",{path:e,name:e.split("/").pop(),isDirectory:!1})}_selectFile(e){this.shadowRoot.querySelectorAll(".file-item").forEach(i=>{i.dataset.path===e?i.classList.add("selected"):i.classList.remove("selected")})}async _handleFileAction(e,t){switch(e){case"rename":await this._renameFile(t);break;case"delete":await this._deleteFile(t);break}}async _renameFile(e){const t=e.split("/").pop(),i=prompt("Enter new name:",t);if(!(!i||i===t))try{const r=await this.readFile(e);await this.writeFile("/"+i,r),await this.deleteFile(e),await this._loadFiles();const o=document.querySelector("pan-bus");o&&o.publish("file.renamed",{oldPath:e,newPath:"/"+i})}catch(r){console.error("Failed to rename file:",r),alert("Failed to rename file")}}async _deleteFile(e){confirm(`Delete ${e}?`)&&(await this.deleteFile(e),await this._loadFiles())}_getFileIcon(e){const t=e.substring(e.lastIndexOf(".")).toLowerCase();return{".md":"📝",".txt":"📄",".js":"📜",".json":"📋",".html":"🌐",".css":"🎨",".jpg":"🖼️",".png":"🖼️",".gif":"🖼️",".pdf":"📕"}[t]||"📄"}_formatSize(e){if(e===0)return"0 B";const t=1024,i=["B","KB","MB","GB"],r=Math.floor(Math.log(e)/Math.log(t));return Math.round(e/Math.pow(t,r)*10)/10+" "+i[r]}async writeFile(e,t){if(this._rootHandle)try{const i=e.replace(/^\//,""),o=await(await this._rootHandle.getFileHandle(i,{create:!0})).createWritable();await o.write(t),await o.close(),console.log("✓ Saved:",e)}catch(i){throw console.error("Failed to write file:",i),i}}async readFile(e){if(!this._rootHandle)return"";try{const t=e.replace(/^\//,"");return await(await(await this._rootHandle.getFileHandle(t)).getFile()).text()}catch(t){throw console.error("Failed to read file:",t),t}}async deleteFile(e){if(this._rootHandle)try{const t=e.replace(/^\//,"");await this._rootHandle.removeEntry(t),console.log("✓ Deleted:",e);const i=document.querySelector("pan-bus");i&&i.publish("file.deleted",{path:e})}catch(t){throw console.error("Failed to delete file:",t),t}}async listFiles(){return this._files}refresh(){return this._loadFiles()}}customElements.define("pan-files",n);var d=n;export{n as PanFiles,d as default};

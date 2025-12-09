import{PanClient as s}from"../../../core/src/components/pan-client.mjs";class o extends HTMLElement{static get observedAttributes(){return["accept","multiple","max-size","topic","preview","drag-drop"]}constructor(){super(),this.attachShadow({mode:"open"}),this.pc=new s(this),this.files=[],this.boundHandlers=null}connectedCallback(){this.render()}attributeChangedCallback(){this.isConnected&&this.render()}get accept(){return this.getAttribute("accept")||""}get multiple(){return this.hasAttribute("multiple")}get maxSize(){return parseInt(this.getAttribute("max-size"))||1/0}get topic(){return this.getAttribute("topic")||"upload"}get preview(){return this.getAttribute("preview")!=="false"}get dragDrop(){return this.getAttribute("drag-drop")!=="false"}setupEvents(){if(this.boundHandlers)return;const r=this.shadowRoot.querySelector(".file-input"),e=this.shadowRoot.querySelector(".drop-zone"),t=this.shadowRoot.querySelector(".browse-btn");this.boundHandlers={fileChange:i=>this.handleFiles(i.target.files),browseClick:()=>r?.click(),preventDefaults:i=>{i.preventDefault(),i.stopPropagation()},dragEnter:()=>e?.classList.add("drag-over"),dragLeave:()=>e?.classList.remove("drag-over"),drop:i=>{e?.classList.remove("drag-over");const a=i.dataTransfer.files;this.handleFiles(a)}},r&&r.addEventListener("change",this.boundHandlers.fileChange),t&&t.addEventListener("click",this.boundHandlers.browseClick),e&&this.dragDrop&&(["dragenter","dragover","dragleave","drop"].forEach(i=>{e.addEventListener(i,this.boundHandlers.preventDefaults)}),["dragenter","dragover"].forEach(i=>{e.addEventListener(i,this.boundHandlers.dragEnter)}),e.addEventListener("dragleave",this.boundHandlers.dragLeave),e.addEventListener("drop",this.boundHandlers.drop))}async handleFiles(r){const e=Array.from(r);for(const t of e){if(t.size>this.maxSize){this.publishError(`File ${t.name} exceeds maximum size`,t);continue}const i={name:t.name,size:t.size,type:t.type,lastModified:t.lastModified};this.preview&&t.type.startsWith("image/")&&(i.dataUrl=await this.readFileAsDataURL(t)),this.files.push({file:t,data:i})}this.renderFileList(),this.pc.publish({topic:`${this.topic}.upload`,data:{files:e,data:this.files.map(t=>t.data)}})}readFileAsDataURL(r){return new Promise(e=>{const t=new FileReader;t.onload=i=>e(i.target.result),t.onerror=()=>e(null),t.readAsDataURL(r)})}removeFile(r){this.files.splice(r,1),this.renderFileList(),this.pc.publish({topic:`${this.topic}.remove`,data:{index:r}})}publishError(r,e){this.pc.publish({topic:`${this.topic}.error`,data:{error:r,file:e?{name:e.name,size:e.size,type:e.type}:null}})}formatFileSize(r){if(r===0)return"0 B";const e=1024,t=["B","KB","MB","GB"],i=Math.floor(Math.log(r)/Math.log(e));return Math.round(r/Math.pow(e,i)*100)/100+" "+t[i]}renderFileList(){const r=this.shadowRoot.querySelector(".file-list");if(r){if(this.files.length===0){r.innerHTML="";return}r.innerHTML=this.files.map((e,t)=>{const{data:i}=e;return`
        <div class="file-item">
          ${i.type.startsWith("image/")&&i.dataUrl?`
            <div class="file-preview">
              <img src="${i.dataUrl}" alt="${i.name}">
            </div>
          `:`
            <div class="file-icon">📄</div>
          `}
          <div class="file-info">
            <div class="file-name">${i.name}</div>
            <div class="file-size">${this.formatFileSize(i.size)}</div>
          </div>
          <button class="remove-btn" data-index="${t}">✕</button>
        </div>
      `}).join(""),r.querySelectorAll(".remove-btn").forEach(e=>{e.addEventListener("click",()=>{const t=parseInt(e.dataset.index);this.removeFile(t)})})}}render(){this.boundHandlers=null,this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: block;
        }

        .upload-container {
          width: 100%;
        }

        .drop-zone {
          border: 2px dashed var(--upload-border, #cbd5e1);
          border-radius: 0.75rem;
          padding: 2rem;
          text-align: center;
          background: var(--upload-bg, #f8fafc);
          transition: all 0.2s;
          cursor: pointer;
        }

        .drop-zone:hover {
          border-color: var(--upload-hover-border, #6366f1);
          background: var(--upload-hover-bg, #f1f5f9);
        }

        .drop-zone.drag-over {
          border-color: var(--upload-active-border, #6366f1);
          background: var(--upload-active-bg, #eef2ff);
        }

        .drop-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .drop-text {
          font-size: 1rem;
          color: var(--upload-text, #64748b);
          margin-bottom: 0.5rem;
        }

        .drop-hint {
          font-size: 0.875rem;
          color: var(--upload-hint, #94a3b8);
        }

        .browse-btn {
          margin-top: 1rem;
          padding: 0.625rem 1.25rem;
          background: var(--upload-btn-bg, #6366f1);
          color: white;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-family: inherit;
          font-weight: 600;
          transition: all 0.2s;
        }

        .browse-btn:hover {
          background: var(--upload-btn-hover, #4f46e5);
        }

        .file-input {
          display: none;
        }

        .file-list {
          margin-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .file-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem;
          background: var(--upload-item-bg, #ffffff);
          border: 1px solid var(--upload-item-border, #e2e8f0);
          border-radius: 0.5rem;
        }

        .file-preview {
          width: 60px;
          height: 60px;
          border-radius: 0.375rem;
          overflow: hidden;
          flex-shrink: 0;
        }

        .file-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .file-icon {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          background: var(--upload-icon-bg, #f1f5f9);
          border-radius: 0.375rem;
          flex-shrink: 0;
        }

        .file-info {
          flex: 1;
          min-width: 0;
        }

        .file-name {
          font-weight: 500;
          color: var(--upload-file-name, #1e293b);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-size {
          font-size: 0.875rem;
          color: var(--upload-file-size, #64748b);
        }

        .remove-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: var(--upload-remove-bg, #fee2e2);
          color: var(--upload-remove-color, #ef4444);
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 1.125rem;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .remove-btn:hover {
          background: var(--upload-remove-hover, #fecaca);
        }
      </style>

      <div class="upload-container">
        <div class="drop-zone">
          <div class="drop-icon">📁</div>
          <div class="drop-text">
            ${this.dragDrop?"Drag and drop files here":"Click to upload files"}
          </div>
          <div class="drop-hint">
            ${this.accept?`Accepts: ${this.accept}`:"Any file type"}
            ${this.maxSize!==1/0?` • Max: ${this.formatFileSize(this.maxSize)}`:""}
          </div>
          <button class="browse-btn">Browse Files</button>
        </div>

        <input
          type="file"
          class="file-input"
          ${this.accept?`accept="${this.accept}"`:""}
          ${this.multiple?"multiple":""}
        >

        <div class="file-list"></div>
      </div>
    `,this.isConnected&&setTimeout(()=>{this.setupEvents(),this.renderFileList()},0)}}customElements.define("file-upload",o);var l=o;export{o as FileUpload,l as default};

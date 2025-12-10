import{PanClient as g}from"../../../core/pan-client.mjs";class h extends HTMLElement{static get observedAttributes(){return["resource","data","url","editable","expanded","indent","icon-open","icon-closed","icon-leaf"]}constructor(){super(),this.attachShadow({mode:"open"}),this.pc=new g(this),this.tree=[],this.expandedNodes=new Set,this.draggedNode=null,this.draggedPath=null,this.dropTarget=null,this._offs=[],this._listenersAttached=!1}connectedCallback(){this.loadData(),this.render(),this.setupTopics()}disconnectedCallback(){this._offs.forEach(e=>e&&e()),this._offs=[]}attributeChangedCallback(e,t,s){this.isConnected&&(e==="data"||e==="url"?this.loadData():this.render())}get resource(){return this.getAttribute("resource")||"tree"}get editable(){return this.hasAttribute("editable")}get allExpanded(){return this.hasAttribute("expanded")}get indent(){return parseInt(this.getAttribute("indent")||"20",10)}get iconOpen(){return this.getAttribute("icon-open")||"▼"}get iconClosed(){return this.getAttribute("icon-closed")||"▶"}get iconLeaf(){return this.getAttribute("icon-leaf")||"•"}async loadData(){const e=this.getAttribute("data"),t=this.getAttribute("url");if(e)try{this.tree=JSON.parse(e),this.allExpanded&&this.expandAll(),this.render()}catch(s){console.error("Invalid tree data JSON:",s)}else if(t)try{const s=await fetch(t);s.ok&&(this.tree=await s.json(),this.allExpanded&&this.expandAll(),this.render())}catch(s){console.error("Failed to fetch tree data:",s)}}setupTopics(){this._offs.push(this.pc.subscribe(`${this.resource}.data.set`,e=>{e.data.tree&&(this.tree=JSON.parse(JSON.stringify(e.data.tree)),this.allExpanded&&this.expandAll(),this.render())})),this._offs.push(this.pc.subscribe(`${this.resource}.node.expand`,e=>{e.data.id&&this.expandNode(e.data.id)})),this._offs.push(this.pc.subscribe(`${this.resource}.node.collapse`,e=>{e.data.id&&this.collapseNode(e.data.id)})),this._offs.push(this.pc.subscribe(`${this.resource}.node.toggle`,e=>{e.data.id&&this.toggleNode(e.data.id)}))}expandAll(){const e=t=>{t.forEach(s=>{s.children&&s.children.length>0&&(this.expandedNodes.add(s.id),e(s.children))})};e(this.tree)}expandNode(e){this.expandedNodes.add(e),this.render();const t=this.findNodeById(e);t&&this.pc.publish({topic:`${this.resource}.node.expanded`,data:{id:e,node:t}})}collapseNode(e){this.expandedNodes.delete(e),this.render();const t=this.findNodeById(e);t&&this.pc.publish({topic:`${this.resource}.node.collapsed`,data:{id:e,node:t}})}toggleNode(e){this.expandedNodes.has(e)?this.collapseNode(e):this.expandNode(e)}findNodeById(e,t=this.tree,s=[]){for(let n=0;n<t.length;n++){const a=t[n],i=[...s,n];if(a.id===e)return{node:a,path:i};if(a.children&&a.children.length>0){const d=this.findNodeById(e,a.children,i);if(d)return d}}return null}getNodeByPath(e,t=this.tree){let s=t,n=null;for(const a of e){if(n=s[a],!n)return null;s=n.children||[]}return n}moveNode(e,t){const s=JSON.parse(JSON.stringify(this.tree)),n=e.slice(0,-1),a=e[e.length-1],i=t.slice(0,-1),d=t[t.length-1];let r=s;for(const c of n)r=r[c].children;let o=s;for(const c of i)o=o[c].children;const[l]=r.splice(a,1);o.splice(d,0,l),this.tree=s,this.render(),this.pc.publish({topic:`${this.resource}.node.move`,data:{nodeId:l.id,node:l,fromPath:e,toPath:t}})}handleNodeClick(e,t){const s=this.getNodeByPath(t);s&&this.pc.publish({topic:`${this.resource}.node.select`,data:{id:e,node:s,path:t}})}handleLabelEdit(e,t,s){const n=this.getNodeByPath(t);if(!n)return;const a=n.label;n.label=s,this.render(),this.pc.publish({topic:`${this.resource}.node.edit`,data:{id:e,oldLabel:a,newLabel:s,node:n}})}render(){this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: block;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          line-height: 1.5;
          user-select: none;
        }

        .tree {
          padding: 8px;
        }

        .tree-node {
          position: relative;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .node-content {
          display: flex;
          align-items: center;
          padding: 4px 8px;
          cursor: pointer;
          border-radius: 4px;
          transition: background-color 0.15s ease;
        }

        .node-content:hover {
          background-color: #f0f0f0;
        }

        .node-content.drag-over {
          background-color: #e3f2fd;
          border: 2px dashed #2196f3;
        }

        .node-content.dragging {
          opacity: 0.5;
          background-color: #f5f5f5;
        }

        .toggle-icon {
          display: inline-block;
          width: 16px;
          text-align: center;
          margin-right: 4px;
          font-size: 10px;
          color: #666;
          cursor: pointer;
          user-select: none;
        }

        .toggle-icon.leaf {
          cursor: default;
        }

        .node-icon {
          margin-right: 6px;
          font-size: 14px;
        }

        .node-label {
          flex: 1;
          padding: 2px 4px;
          border-radius: 2px;
          outline: none;
        }

        .node-label[contenteditable="true"]:focus {
          background-color: white;
          box-shadow: 0 0 0 2px #2196f3;
        }

        .node-children {
          padding-left: ${this.indent}px;
          list-style: none;
          margin: 0;
        }

        .node-children.collapsed {
          display: none;
        }

        .drag-handle {
          margin-right: 6px;
          color: #999;
          cursor: grab;
          font-size: 12px;
        }

        .drag-handle:active {
          cursor: grabbing;
        }

        .empty-tree {
          padding: 20px;
          text-align: center;
          color: #999;
          font-style: italic;
        }
      </style>
      <div class="tree">
        ${this.tree.length===0?'<div class="empty-tree">No items</div>':this.renderNodes(this.tree)}
      </div>
    `,this.attachEventListeners()}renderNodes(e,t=[]){return`
      <ul class="tree-nodes">
        ${e.map((s,n)=>{const a=[...t,n],i=a.join(","),d=s.children&&s.children.length>0,r=this.expandedNodes.has(s.id),o=d?r?this.iconOpen:this.iconClosed:this.iconLeaf;return`
            <li class="tree-node" data-id="${this.escapeHtml(s.id)}" data-path="${i}">
              <div class="node-content" draggable="${this.editable}">
                ${this.editable?'<span class="drag-handle">⋮⋮</span>':""}
                <span class="toggle-icon ${d?"":"leaf"}" data-action="toggle">
                  ${o}
                </span>
                ${s.icon?`<span class="node-icon">${s.icon}</span>`:""}
                <span class="node-label"
                      contenteditable="${this.editable}"
                      data-action="label"
                      spellcheck="false">
                  ${this.escapeHtml(s.label)}
                </span>
              </div>
              ${d?`
                <ul class="node-children ${r?"":"collapsed"}">
                  ${this.renderNodes(s.children,a)}
                </ul>
              `:""}
            </li>
          `}).join("")}
      </ul>
    `}attachEventListeners(){if(this._listenersAttached)return;this._listenersAttached=!0;const e=this.shadowRoot;e.addEventListener("click",t=>{if(t.target.matches('[data-action="toggle"]')||t.target.closest('[data-action="toggle"]')){const a=(t.target.closest('[data-action="toggle"]')||t.target).closest(".tree-node");if(a){const i=a.dataset.id;this.toggleNode(i)}return}if(t.target.matches('[data-action="label"]')||t.target.closest('[data-action="label"]'))return;if(t.target.closest(".node-content")){const n=t.target.closest(".tree-node");if(n){const a=n.dataset.id,i=n.dataset.path.split(",").map(Number);this.handleNodeClick(a,i)}}}),this.editable&&(e.addEventListener("blur",t=>{if(t.target.matches('[data-action="label"]')){const s=t.target.closest(".tree-node");if(s){const n=s.dataset.id,a=s.dataset.path.split(",").map(Number),i=t.target.textContent.trim();if(i)this.handleLabelEdit(n,a,i);else{const d=this.getNodeByPath(a);t.target.textContent=d.label}}}},!0),e.addEventListener("keydown",t=>{t.target.matches('[contenteditable="true"]')&&t.key==="Enter"&&(t.preventDefault(),t.target.blur())}),this.setupDragAndDrop(e))}setupDragAndDrop(e){e.addEventListener("dragstart",t=>{const s=t.target.closest(".tree-node");s&&(this.draggedNode=s,this.draggedPath=s.dataset.path.split(",").map(Number),t.target.classList.add("dragging"),t.dataTransfer.effectAllowed="move",t.dataTransfer.setData("text/plain",s.dataset.id))}),e.addEventListener("dragend",t=>{t.target.classList.remove("dragging"),e.querySelectorAll(".drag-over").forEach(s=>{s.classList.remove("drag-over")}),this.draggedNode=null,this.draggedPath=null,this.dropTarget=null}),e.addEventListener("dragover",t=>{t.preventDefault(),t.dataTransfer.dropEffect="move";const s=t.target.closest(".node-content");!s||s.closest(".tree-node")===this.draggedNode||(this.dropTarget&&this.dropTarget!==s&&this.dropTarget.classList.remove("drag-over"),s.classList.add("drag-over"),this.dropTarget=s)}),e.addEventListener("dragleave",t=>{const s=t.target.closest(".node-content");s&&s.classList.remove("drag-over")}),e.addEventListener("drop",t=>{t.preventDefault();const s=t.target.closest(".tree-node");if(!s||s===this.draggedNode)return;const n=s.dataset.path.split(",").map(Number);if(n.length>this.draggedPath.length&&n.slice(0,this.draggedPath.length).every((o,l)=>o===this.draggedPath[l])){console.warn("Cannot drop node into its own child");return}const i=n.slice(0,-1),d=n[n.length-1],r=[...i,d+1];this.moveNode(this.draggedPath,r)})}escapeHtml(e){return e==null?"":String(e).replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}}customElements.define("pan-tree",h);var f=h;export{h as PanTree,f as default};

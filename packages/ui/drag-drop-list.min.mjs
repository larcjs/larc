import{PanClient as h}from"../core/pan-client.mjs";class l extends HTMLElement{static get observedAttributes(){return["topic","items","disabled","handle"]}constructor(){super(),this.attachShadow({mode:"open"}),this.pc=new h(this),this.items=[],this.draggedElement=null,this.draggedIndex=null,this.targetIndex=null,this.eventsSetup=!1}connectedCallback(){if(this.getAttribute("items"))try{this.items=JSON.parse(this.getAttribute("items"))}catch(t){console.error("Invalid items JSON:",t)}this.render(),this.setupTopics()}attributeChangedCallback(t,e,d){if(t==="items"&&d)try{this.items=JSON.parse(d),this.isConnected&&this.render()}catch(r){console.error("Invalid items JSON:",r)}else this.isConnected&&this.render()}get topic(){return this.getAttribute("topic")||"list"}get disabled(){return this.hasAttribute("disabled")}get handle(){return this.getAttribute("handle")||null}setupTopics(){this.pc.subscribe(`${this.topic}.setItems`,t=>{t.data.items&&(this.items=t.data.items,this.render())}),this.pc.subscribe(`${this.topic}.addItem`,t=>{if(t.data.item){const e=t.data.index??this.items.length;this.items.splice(e,0,t.data.item),this.render()}}),this.pc.subscribe(`${this.topic}.removeItem`,t=>{t.data.id&&(this.items=this.items.filter(e=>e.id!==t.data.id),this.render())})}setupDragEvents(){if(this.eventsSetup)return;this.eventsSetup=!0;const t=this.shadowRoot.querySelectorAll(".list-item");t.forEach((e,d)=>{const r=this.handle?e.querySelector(this.handle):e;r&&(r.style.cursor="grab",e.setAttribute("draggable","true"),e.addEventListener("dragstart",i=>{this.disabled||(this.draggedElement=e,this.draggedIndex=d,e.classList.add("dragging"),r.style.cursor="grabbing",i.dataTransfer.effectAllowed="move",i.dataTransfer.setData("text/html",e.innerHTML))}),e.addEventListener("dragend",i=>{e.classList.remove("dragging"),r.style.cursor="grab",this.draggedElement=null,this.draggedIndex=null,this.targetIndex=null,t.forEach(s=>s.classList.remove("drag-over"))}),e.addEventListener("dragover",i=>{if(this.disabled||!this.draggedElement)return;i.preventDefault();const s=this.getDragAfterElement(i.clientY);s==null?e.parentElement.appendChild(this.draggedElement):e.parentElement.insertBefore(this.draggedElement,s);const a=Array.from(this.shadowRoot.querySelectorAll(".list-item"));this.targetIndex=a.indexOf(this.draggedElement)}),e.addEventListener("dragenter",i=>{this.disabled||!this.draggedElement||e!==this.draggedElement&&e.classList.add("drag-over")}),e.addEventListener("dragleave",i=>{e.classList.remove("drag-over")}),e.addEventListener("drop",i=>{if(this.disabled)return;i.preventDefault(),console.log("[drag-drop-list] Drop event fired!"),e.classList.remove("drag-over");const s=this.draggedIndex,a=this.targetIndex;if(console.log("[drag-drop-list] Drop:",{oldIndex:s,newIndex:a,targetIndex:this.targetIndex}),s!==a&&s!==null&&a!==null){const o=this.items[s];this.items.splice(s,1),this.items.splice(a,0,o);const n=`${this.topic}.reorder`;console.log("[drag-drop-list] Publishing to:",n,{items:this.items,from:s,to:a}),this.pc.publish({topic:n,data:{items:this.items,from:s,to:a}}),this.render()}}))})}getDragAfterElement(t){return[...this.shadowRoot.querySelectorAll(".list-item:not(.dragging)")].reduce((d,r)=>{const i=r.getBoundingClientRect(),s=t-i.top-i.height/2;return s<0&&s>d.offset?{offset:s,element:r}:d},{offset:Number.NEGATIVE_INFINITY}).element}render(){this.eventsSetup=!1,this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: block;
        }

        .list-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .list-item {
          background: var(--list-item-bg, #ffffff);
          border: 1px solid var(--list-item-border, #e2e8f0);
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          transition: all 0.2s;
          user-select: none;
        }

        .list-item:not([draggable]) {
          cursor: default;
        }

        .list-item.dragging {
          opacity: 0.5;
          transform: scale(0.95);
        }

        .list-item.drag-over {
          border-color: var(--list-drag-border, #6366f1);
          background: var(--list-drag-bg, #eef2ff);
          transform: translateY(-2px);
        }

        .list-item:not(.dragging):hover {
          border-color: var(--list-hover-border, #cbd5e1);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .item-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .drag-handle {
          color: var(--list-handle-color, #94a3b8);
          font-size: 1.25rem;
          line-height: 1;
        }

        :host([disabled]) .list-item {
          cursor: default !important;
          opacity: 0.6;
        }

        .empty-state {
          padding: 2rem;
          text-align: center;
          color: var(--list-empty-color, #94a3b8);
          font-style: italic;
        }
      </style>

      <div class="list-container">
        ${this.items.length===0?`
          <div class="empty-state">
            <slot name="empty">No items to display</slot>
          </div>
        `:this.items.map((t,e)=>`
          <div class="list-item" data-id="${t.id}" data-index="${e}">
            <div class="item-content">
              ${!this.disabled&&!this.handle?'<span class="drag-handle">⋮⋮</span>':""}
              <div class="item-body">
                <slot name="item-${t.id}">
                  ${t.content||t.label||t.title||JSON.stringify(t)}
                </slot>
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    `,this.disabled||setTimeout(()=>this.setupDragEvents(),0)}}customElements.define("drag-drop-list",l);var m=l;export{l as DragDropList,m as default};

import{PanClient as s}from"../../../core/src/components/pan-client.mjs";class l extends HTMLElement{static get observedAttributes(){return["value","type","placeholder","topic","cell-id","editable","multiline"]}constructor(){super(),this.attachShadow({mode:"open"}),this.pc=new s(this),this.isEditing=!1,this.oldValue=""}connectedCallback(){this.render(),this.setupTopics(),this.setupEvents()}attributeChangedCallback(t,e,i){t==="value"&&e!==i&&!this.isEditing?this.isConnected&&this.render():this.isConnected&&this.render()}get value(){return this.getAttribute("value")||""}set value(t){this.setAttribute("value",t)}get type(){return this.getAttribute("type")||"text"}get placeholder(){return this.getAttribute("placeholder")||"Click to edit"}get topic(){return this.getAttribute("topic")||"cell"}get cellId(){return this.getAttribute("cell-id")||crypto.randomUUID()}get editable(){return this.getAttribute("editable")!=="false"}get multiline(){return this.hasAttribute("multiline")}setupTopics(){this.pc.subscribe(`${this.topic}.setValue`,t=>{t.data.cellId===this.cellId&&(this.value=t.data.value)})}setupEvents(){const t=this.shadowRoot.querySelector(".cell-display"),e=this.shadowRoot.querySelector(".cell-input");t&&this.editable&&(t.addEventListener("click",()=>this.startEdit()),t.addEventListener("dblclick",()=>this.startEdit())),e&&(e.addEventListener("blur",()=>this.finishEdit()),e.addEventListener("keydown",i=>{i.key==="Enter"&&!this.multiline?(i.preventDefault(),this.finishEdit()):i.key==="Escape"?this.cancelEdit():i.key==="Enter"&&i.ctrlKey&&this.multiline&&this.finishEdit()}),e.addEventListener("focus",()=>{this.pc.publish({topic:`${this.topic}.focus`,data:{cellId:this.cellId}})}))}startEdit(){if(!this.editable||this.isEditing)return;this.isEditing=!0,this.oldValue=this.value;const t=this.shadowRoot.querySelector(".cell-display"),e=this.shadowRoot.querySelector(".cell-input");t&&(t.style.display="none"),e&&(e.style.display="block",e.value=this.value,e.focus(),e.select&&e.select())}finishEdit(){if(!this.isEditing)return;const t=this.shadowRoot.querySelector(".cell-input"),e=t?t.value:this.value;this.isEditing=!1,e!==this.oldValue&&(this.value=e,this.pc.publish({topic:`${this.topic}.change`,data:{cellId:this.cellId,value:e,oldValue:this.oldValue}})),this.updateDisplay(),this.pc.publish({topic:`${this.topic}.blur`,data:{cellId:this.cellId}})}cancelEdit(){this.isEditing&&(this.isEditing=!1,this.updateDisplay())}updateDisplay(){const t=this.shadowRoot.querySelector(".cell-display"),e=this.shadowRoot.querySelector(".cell-input");t&&(t.style.display="flex",t.textContent=this.value||this.placeholder,t.classList.toggle("empty",!this.value)),e&&(e.style.display="none")}render(){const t=!!this.value;this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: block;
        }

        .cell-container {
          position: relative;
          min-height: 32px;
        }

        .cell-display {
          display: flex;
          align-items: center;
          padding: 0.5rem 0.75rem;
          min-height: 32px;
          cursor: ${this.editable?"text":"default"};
          border-radius: 0.375rem;
          transition: all 0.2s;
          color: var(--cell-color, #1e293b);
          background: var(--cell-bg, transparent);
          border: 1px solid transparent;
        }

        .cell-display:hover {
          background: var(--cell-hover-bg, #f8fafc);
          border-color: var(--cell-hover-border, #e2e8f0);
        }

        .cell-display.empty {
          color: var(--cell-placeholder-color, #94a3b8);
          font-style: italic;
        }

        .cell-input {
          display: none;
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 2px solid var(--cell-focus-border, #6366f1);
          border-radius: 0.375rem;
          font-family: inherit;
          font-size: inherit;
          background: var(--cell-input-bg, #ffffff);
          color: var(--cell-color, #1e293b);
          outline: none;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        textarea.cell-input {
          min-height: 80px;
          resize: vertical;
        }

        .cell-input:focus {
          border-color: var(--cell-focus-border, #6366f1);
        }

        :host([editable="false"]) .cell-display {
          cursor: default;
        }

        :host([editable="false"]) .cell-display:hover {
          background: transparent;
          border-color: transparent;
        }
      </style>

      <div class="cell-container">
        <div class="cell-display ${t?"":"empty"}">
          ${this.value||this.placeholder}
        </div>
        ${this.multiline?`
          <textarea class="cell-input" placeholder="${this.placeholder}"></textarea>
        `:`
          <input
            type="${this.type}"
            class="cell-input"
            placeholder="${this.placeholder}"
          >
        `}
      </div>
    `,this.isConnected&&setTimeout(()=>this.setupEvents(),0)}}customElements.define("editable-cell",l);var o=l;export{l as EditableCell,o as default};

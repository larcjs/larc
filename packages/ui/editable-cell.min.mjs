import{PanClient as s}from"../core/pan-client.mjs";class l extends HTMLElement{static get observedAttributes(){return["value","type","placeholder","topic","cell-id","editable","multiline"]}constructor(){super(),this.attachShadow({mode:"open"}),this.pc=new s(this),this.isEditing=!1,this.oldValue=""}connectedCallback(){this.render(),this.setupTopics(),this.setupEvents()}attributeChangedCallback(e,t,i){e==="value"&&t!==i&&!this.isEditing?this.isConnected&&this.render():this.isConnected&&this.render()}get value(){return this.getAttribute("value")||""}set value(e){this.setAttribute("value",e)}get type(){return this.getAttribute("type")||"text"}get placeholder(){return this.getAttribute("placeholder")||"Click to edit"}get topic(){return this.getAttribute("topic")||"cell"}get cellId(){return this.getAttribute("cell-id")||crypto.randomUUID()}get editable(){return this.getAttribute("editable")!=="false"}get multiline(){return this.hasAttribute("multiline")}escapeHTML(e){if(!e||typeof e!="string")return"";const t={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return e.replace(/[&<>"']/g,i=>t[i])}setupTopics(){this.pc.subscribe(`${this.topic}.setValue`,e=>{e.data.cellId===this.cellId&&(this.value=e.data.value)})}setupEvents(){const e=this.shadowRoot.querySelector(".cell-display"),t=this.shadowRoot.querySelector(".cell-input");e&&this.editable&&(e.addEventListener("click",()=>this.startEdit()),e.addEventListener("dblclick",()=>this.startEdit())),t&&(t.addEventListener("blur",()=>this.finishEdit()),t.addEventListener("keydown",i=>{i.key==="Enter"&&!this.multiline?(i.preventDefault(),this.finishEdit()):i.key==="Escape"?this.cancelEdit():i.key==="Enter"&&i.ctrlKey&&this.multiline&&this.finishEdit()}),t.addEventListener("focus",()=>{this.pc.publish({topic:`${this.topic}.focus`,data:{cellId:this.cellId}})}))}startEdit(){if(!this.editable||this.isEditing)return;this.isEditing=!0,this.oldValue=this.value;const e=this.shadowRoot.querySelector(".cell-display"),t=this.shadowRoot.querySelector(".cell-input");e&&(e.style.display="none"),t&&(t.style.display="block",t.value=this.value,t.focus(),t.select&&t.select())}finishEdit(){if(!this.isEditing)return;const e=this.shadowRoot.querySelector(".cell-input"),t=e?e.value:this.value;this.isEditing=!1,t!==this.oldValue&&(this.value=t,this.pc.publish({topic:`${this.topic}.change`,data:{cellId:this.cellId,value:t,oldValue:this.oldValue}})),this.updateDisplay(),this.pc.publish({topic:`${this.topic}.blur`,data:{cellId:this.cellId}})}cancelEdit(){this.isEditing&&(this.isEditing=!1,this.updateDisplay())}updateDisplay(){const e=this.shadowRoot.querySelector(".cell-display"),t=this.shadowRoot.querySelector(".cell-input");e&&(e.style.display="flex",e.textContent=this.value||this.placeholder,e.classList.toggle("empty",!this.value)),t&&(t.style.display="none")}render(){const e=!!this.value;this.shadowRoot.innerHTML=`
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
        <div class="cell-display ${e?"":"empty"}">
          ${this.escapeHTML(this.value)||this.escapeHTML(this.placeholder)}
        </div>
        ${this.multiline?`
          <textarea class="cell-input" placeholder="${this.escapeHTML(this.placeholder)}"></textarea>
        `:`
          <input
            type="${["text","number","email","url","tel","date"].includes(this.type)?this.type:"text"}"
            class="cell-input"
            placeholder="${this.escapeHTML(this.placeholder)}"
          >
        `}
      </div>
    `,this.isConnected&&setTimeout(()=>this.setupEvents(),0)}}customElements.define("editable-cell",l);var o=l;export{l as EditableCell,o as default};

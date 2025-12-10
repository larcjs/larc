import{PanClient as s}from"../../../core/pan-client.mjs";class i extends HTMLElement{static get observedAttributes(){return["topic","modal-id","title","size","closable"]}constructor(){super(),this.attachShadow({mode:"open"}),this.pc=new s(this),this.isOpen=!1}connectedCallback(){this.render(),this.setupTopics(),this.setupEvents()}attributeChangedCallback(){this.isConnected&&this.render()}get modalId(){return this.getAttribute("modal-id")||"default"}get topic(){return this.getAttribute("topic")||`modal.${this.modalId}`}get title(){return this.getAttribute("title")||""}get size(){return this.getAttribute("size")||"md"}get closable(){return this.getAttribute("closable")!=="false"}setupTopics(){this.pc.subscribe(`${this.topic}.show`,()=>this.show()),this.pc.subscribe(`${this.topic}.hide`,()=>this.hide()),this.pc.subscribe(`${this.topic}.toggle`,()=>this.toggle())}setupEvents(){const t=this.shadowRoot.querySelector(".modal-backdrop"),o=this.shadowRoot.querySelector(".close-btn");t&&t.addEventListener("click",e=>{e.target===t&&this.closable&&this.hide()}),o&&o.addEventListener("click",()=>this.hide()),this.handleKeydown=e=>{e.key==="Escape"&&this.isOpen&&this.closable&&this.hide()},document.addEventListener("keydown",this.handleKeydown)}disconnectedCallback(){document.removeEventListener("keydown",this.handleKeydown)}show(){if(this.isOpen)return;this.isOpen=!0;const t=this.shadowRoot.querySelector(".modal-backdrop");t&&(t.classList.add("active"),document.body.style.overflow="hidden"),this.pc.publish({topic:`${this.topic}.opened`,data:{modalId:this.modalId}})}hide(){if(!this.isOpen)return;this.isOpen=!1;const t=this.shadowRoot.querySelector(".modal-backdrop");t&&(t.classList.remove("active"),document.body.style.overflow=""),this.pc.publish({topic:`${this.topic}.closed`,data:{modalId:this.modalId}})}toggle(){this.isOpen?this.hide():this.show()}render(){this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: contents;
        }

        .modal-backdrop {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .modal-backdrop.active {
          display: flex;
          opacity: 1;
        }

        .modal-content {
          background: var(--modal-bg, #ffffff);
          border-radius: var(--modal-radius, 0.75rem);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          transform: scale(0.95);
          transition: transform 0.2s ease;
        }

        .modal-backdrop.active .modal-content {
          transform: scale(1);
        }

        .modal-content.size-sm { width: 400px; max-width: 90vw; }
        .modal-content.size-md { width: 600px; max-width: 90vw; }
        .modal-content.size-lg { width: 800px; max-width: 90vw; }
        .modal-content.size-xl { width: 1200px; max-width: 95vw; }
        .modal-content.size-full { width: 95vw; height: 95vh; max-height: 95vh; }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--modal-border, #e2e8f0);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--modal-title-color, #1e293b);
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: var(--modal-close-color, #64748b);
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.375rem;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: var(--modal-close-hover-bg, #f1f5f9);
          color: var(--modal-close-hover-color, #1e293b);
        }

        .modal-body {
          padding: 1.5rem;
          overflow-y: auto;
          flex: 1;
          color: var(--modal-text-color, #334155);
        }

        .modal-footer {
          padding: 1.5rem;
          border-top: 1px solid var(--modal-border, #e2e8f0);
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          background: var(--modal-footer-bg, #f8fafc);
        }

        .hidden {
          display: none;
        }
      </style>

      <div class="modal-backdrop">
        <div class="modal-content size-${this.size}" role="dialog" aria-modal="true">
          <div class="modal-header">
            <slot name="header">
              ${this.title?`<h2 class="modal-title">${this.title}</h2>`:""}
            </slot>
            ${this.closable?`
              <button class="close-btn" aria-label="Close">&times;</button>
            `:""}
          </div>

          <div class="modal-body">
            <slot></slot>
          </div>

          <div class="modal-footer ${this.querySelector('[slot="footer"]')?"":"hidden"}">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    `}}customElements.define("pan-modal",i);var l=i;export{i as PanModal,l as default};

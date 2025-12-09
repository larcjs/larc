import{PanClient as d}from"../../../core/src/components/pan-client.mjs";class i extends HTMLElement{static get observedAttributes(){return["label","position","topic","items"]}constructor(){super(),this.attachShadow({mode:"open"}),this.pc=new d(this),this.isOpen=!1}connectedCallback(){this.render(),this.setupEvents()}disconnectedCallback(){document.removeEventListener("click",this.handleOutsideClick)}attributeChangedCallback(){this.isConnected&&this.render()}get label(){return this.getAttribute("label")||"Menu"}get position(){return this.getAttribute("position")||"bottom-left"}get topic(){return this.getAttribute("topic")||"dropdown"}get items(){const t=this.getAttribute("items");if(!t)return[];try{return JSON.parse(t)}catch{return[]}}setupEvents(){const t=this.shadowRoot.querySelector(".dropdown-trigger"),o=this.shadowRoot.querySelector(".dropdown-menu");t&&t.addEventListener("click",e=>{e.stopPropagation(),this.toggle()}),o&&o.addEventListener("click",e=>{const r=e.target.closest("[data-value]");if(r&&!r.hasAttribute("disabled")){const n=r.dataset.value,s=r.textContent.trim();this.selectItem(n,s)}}),this.handleOutsideClick=e=>{!this.contains(e.target)&&this.isOpen&&this.close()},document.addEventListener("click",this.handleOutsideClick)}toggle(){this.isOpen?this.close():this.open()}open(){if(this.isOpen)return;this.isOpen=!0;const t=this.shadowRoot.querySelector(".dropdown-menu");t&&t.classList.add("active"),this.pc.publish({topic:`${this.topic}.opened`,data:{}})}close(){if(!this.isOpen)return;this.isOpen=!1;const t=this.shadowRoot.querySelector(".dropdown-menu");t&&t.classList.remove("active"),this.pc.publish({topic:`${this.topic}.closed`,data:{}})}selectItem(t,o){this.pc.publish({topic:`${this.topic}.select`,data:{value:t,label:o}}),this.close()}render(){const t=this.querySelector('[slot="trigger"]'),o=this.querySelector(":not([slot])");this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: inline-block;
          position: relative;
        }

        .dropdown-trigger {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          background: var(--dropdown-trigger-bg, #ffffff);
          border: 1px solid var(--dropdown-trigger-border, #e2e8f0);
          border-radius: 0.5rem;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--dropdown-trigger-color, #1e293b);
          transition: all 0.2s;
        }

        .dropdown-trigger:hover {
          background: var(--dropdown-trigger-hover-bg, #f8fafc);
          border-color: var(--dropdown-trigger-hover-border, #cbd5e1);
        }

        .dropdown-arrow {
          font-size: 0.75rem;
          transition: transform 0.2s;
        }

        .dropdown-trigger.open .dropdown-arrow {
          transform: rotate(180deg);
        }

        .dropdown-menu {
          position: absolute;
          min-width: 200px;
          background: var(--dropdown-menu-bg, #ffffff);
          border: 1px solid var(--dropdown-menu-border, #e2e8f0);
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.2s ease;
          padding: 0.5rem 0;
        }

        .dropdown-menu.active {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .dropdown-menu.position-bottom-left {
          top: calc(100% + 0.5rem);
          left: 0;
        }

        .dropdown-menu.position-bottom-right {
          top: calc(100% + 0.5rem);
          right: 0;
        }

        .dropdown-menu.position-top-left {
          bottom: calc(100% + 0.5rem);
          left: 0;
        }

        .dropdown-menu.position-top-right {
          bottom: calc(100% + 0.5rem);
          right: 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 1rem;
          cursor: pointer;
          color: var(--dropdown-item-color, #334155);
          font-size: 0.95rem;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .dropdown-item:hover {
          background: var(--dropdown-item-hover-bg, #f1f5f9);
          color: var(--dropdown-item-hover-color, #1e293b);
        }

        .dropdown-item[disabled] {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dropdown-item[disabled]:hover {
          background: transparent;
        }

        .dropdown-divider {
          height: 1px;
          background: var(--dropdown-divider-color, #e2e8f0);
          margin: 0.5rem 0;
        }

        .item-icon {
          font-size: 1rem;
        }
      </style>

      <div class="dropdown">
        ${t?`
          <slot name="trigger"></slot>
        `:`
          <button class="dropdown-trigger ${this.isOpen?"open":""}">
            ${this.label}
            <span class="dropdown-arrow">▼</span>
          </button>
        `}

        <div class="dropdown-menu position-${this.position}">
          ${o?`
            <slot></slot>
          `:this.items.map(e=>e.divider?'<div class="dropdown-divider"></div>':`
              <div
                class="dropdown-item"
                data-value="${e.value||e.label}"
                ${e.disabled?"disabled":""}
              >
                ${e.icon?`<span class="item-icon">${e.icon}</span>`:""}
                ${e.label}
              </div>
            `).join("")}
        </div>
      </div>
    `}}customElements.define("pan-dropdown",i);var p=i;export{i as PanDropdown,p as default};

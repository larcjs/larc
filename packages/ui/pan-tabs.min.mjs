import{PanClient as r}from"../core/pan-client.mjs";class o extends HTMLElement{static get observedAttributes(){return["active","topic","tabs"]}constructor(){super(),this.attachShadow({mode:"open"}),this.pc=new r(this),this.activeIndex=0}connectedCallback(){this.activeIndex=parseInt(this.getAttribute("active"))||0,this.render(),this.setupTopics(),this.setupEvents()}attributeChangedCallback(t,a,e){t==="active"&&a!==e&&(this.activeIndex=parseInt(e)||0),this.isConnected&&this.render()}get topic(){return this.getAttribute("topic")||"tabs"}get tabs(){const t=this.getAttribute("tabs");if(!t)return Array.from(this.querySelectorAll('[slot^="tab-"]')).map((e,s)=>({label:e.getAttribute("data-label")||`Tab ${s+1}`,id:e.getAttribute("slot").replace("tab-","")}));try{return JSON.parse(t)}catch{return[]}}setupTopics(){this.pc.subscribe(`${this.topic}.select`,t=>{typeof t.data.index=="number"&&this.selectTab(t.data.index)})}setupEvents(){this.shadowRoot.querySelectorAll(".tab-button").forEach((a,e)=>{a.addEventListener("click",()=>{a.hasAttribute("disabled")||this.selectTab(e)})})}selectTab(t){if(t<0||t>=this.tabs.length||this.tabs[t].disabled)return;this.activeIndex=t,this.setAttribute("active",t);const a=this.shadowRoot.querySelectorAll(".tab-button"),e=this.shadowRoot.querySelectorAll(".tab-panel");a.forEach((s,i)=>{s.classList.toggle("active",i===t),s.setAttribute("aria-selected",i===t)}),e.forEach((s,i)=>{s.classList.toggle("active",i===t),s.setAttribute("aria-hidden",i!==t)}),this.pc.publish({topic:`${this.topic}.changed`,data:{index:t,id:this.tabs[t].id||t,label:this.tabs[t].label}})}escapeHTML(t){if(!t||typeof t!="string")return"";const a={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return t.replace(/[&<>"']/g,e=>a[e])}render(){const t=this.tabs;this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: block;
        }

        .tabs-container {
          display: flex;
          flex-direction: column;
        }

        .tab-list {
          display: flex;
          gap: 0.25rem;
          border-bottom: 2px solid var(--tabs-border, #e2e8f0);
          background: var(--tabs-bg, #f8fafc);
          padding: 0 0.5rem;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 1.25rem;
          border: none;
          background: transparent;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--tabs-color, #64748b);
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          transition: all 0.2s;
        }

        .tab-button:hover:not([disabled]) {
          color: var(--tabs-hover-color, #1e293b);
          background: var(--tabs-hover-bg, #f1f5f9);
        }

        .tab-button.active {
          color: var(--tabs-active-color, #6366f1);
          border-bottom-color: var(--tabs-active-border, #6366f1);
          background: var(--tabs-active-bg, #ffffff);
        }

        .tab-button[disabled] {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .tab-icon {
          font-size: 1.125rem;
        }

        .tab-panels {
          padding: 1.5rem;
          background: var(--tabs-panel-bg, #ffffff);
        }

        .tab-panel {
          display: none;
        }

        .tab-panel.active {
          display: block;
        }
      </style>

      <div class="tabs-container" role="tablist">
        <div class="tab-list">
          ${t.map((a,e)=>`
            <button
              class="tab-button ${e===this.activeIndex?"active":""}"
              role="tab"
              aria-selected="${e===this.activeIndex}"
              ${a.disabled?"disabled":""}
            >
              ${a.icon?`<span class="tab-icon">${this.escapeHTML(a.icon)}</span>`:""}
              ${this.escapeHTML(a.label)}
            </button>
          `).join("")}
        </div>

        <div class="tab-panels">
          ${t.map((a,e)=>`
            <div
              class="tab-panel ${e===this.activeIndex?"active":""}"
              role="tabpanel"
              aria-hidden="${e!==this.activeIndex}"
            >
              <slot name="tab-${a.id||e}"></slot>
            </div>
          `).join("")}
        </div>
      </div>
    `,this.isConnected&&setTimeout(()=>this.setupEvents(),0)}}customElements.define("pan-tabs",o);var c=o;export{o as PanTabs,c as default};

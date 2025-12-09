import{PanClient as p}from"../../../core/src/components/pan-client.mjs";class g extends HTMLElement{static get observedAttributes(){return["current-page","total-pages","total-items","page-size","topic","show-info","show-jump"]}constructor(){super(),this.attachShadow({mode:"open"}),this.pc=new p(this)}connectedCallback(){this.render(),this.setupTopics(),this.setupEvents()}attributeChangedCallback(){this.isConnected&&this.render()}get currentPage(){return parseInt(this.getAttribute("current-page"))||1}set currentPage(t){this.setAttribute("current-page",t)}get totalPages(){const t=parseInt(this.getAttribute("total-pages"));if(t)return t;const i=this.totalItems,e=this.pageSize;return i&&e?Math.ceil(i/e):1}get totalItems(){return parseInt(this.getAttribute("total-items"))||0}get pageSize(){return parseInt(this.getAttribute("page-size"))||10}get topic(){return this.getAttribute("topic")||"pagination"}get showInfo(){return this.getAttribute("show-info")!=="false"}get showJump(){return this.hasAttribute("show-jump")}setupTopics(){this.pc.subscribe(`${this.topic}.goto`,t=>{typeof t.data.page=="number"&&this.goToPage(t.data.page)})}setupEvents(){const t=this.shadowRoot.querySelector(".prev-btn"),i=this.shadowRoot.querySelector(".next-btn"),e=this.shadowRoot.querySelector(".first-btn"),a=this.shadowRoot.querySelector(".last-btn"),r=this.shadowRoot.querySelectorAll(".page-btn"),n=this.shadowRoot.querySelector(".jump-input");t&&t.addEventListener("click",()=>this.goToPage(this.currentPage-1)),i&&i.addEventListener("click",()=>this.goToPage(this.currentPage+1)),e&&e.addEventListener("click",()=>this.goToPage(1)),a&&a.addEventListener("click",()=>this.goToPage(this.totalPages)),r.forEach(o=>{o.addEventListener("click",()=>{const s=parseInt(o.dataset.page);this.goToPage(s)})}),n&&n.addEventListener("keypress",o=>{if(o.key==="Enter"){const s=parseInt(n.value);s>=1&&s<=this.totalPages&&this.goToPage(s)}})}goToPage(t){t<1||t>this.totalPages||t!==this.currentPage&&(this.currentPage=t,this.pc.publish({topic:`${this.topic}.changed`,data:{page:t,pageSize:this.pageSize}}))}getPageNumbers(){const t=this.currentPage,i=this.totalPages,e=[];if(i<=7)for(let a=1;a<=i;a++)e.push(a);else{e.push(1),t>3&&e.push("...");const a=Math.max(2,t-1),r=Math.min(i-1,t+1);for(let n=a;n<=r;n++)e.push(n);t<i-2&&e.push("..."),e.push(i)}return e}render(){const t=this.getPageNumbers(),i=(this.currentPage-1)*this.pageSize+1,e=Math.min(this.currentPage*this.pageSize,this.totalItems);this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: block;
        }

        .pagination {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .pagination-info {
          color: var(--pagination-info-color, #64748b);
          font-size: 0.875rem;
        }

        .pagination-buttons {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .pagination-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 2.5rem;
          height: 2.5rem;
          padding: 0 0.75rem;
          border: 1px solid var(--pagination-border, #e2e8f0);
          background: var(--pagination-bg, #ffffff);
          color: var(--pagination-color, #334155);
          border-radius: 0.5rem;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .pagination-btn:hover:not(:disabled) {
          background: var(--pagination-hover-bg, #f8fafc);
          border-color: var(--pagination-hover-border, #cbd5e1);
        }

        .pagination-btn.active {
          background: var(--pagination-active-bg, #6366f1);
          color: var(--pagination-active-color, #ffffff);
          border-color: var(--pagination-active-border, #6366f1);
        }

        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .pagination-btn.ellipsis {
          border: none;
          background: transparent;
          cursor: default;
        }

        .pagination-btn.ellipsis:hover {
          background: transparent;
        }

        .jump-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .jump-input {
          width: 4rem;
          padding: 0.5rem;
          border: 1px solid var(--pagination-border, #e2e8f0);
          border-radius: 0.375rem;
          font-family: inherit;
          text-align: center;
        }
      </style>

      <div class="pagination">
        ${this.showInfo&&this.totalItems>0?`
          <div class="pagination-info">
            Showing ${i}-${e} of ${this.totalItems}
          </div>
        `:""}

        <div class="pagination-buttons">
          <button
            class="pagination-btn first-btn"
            ${this.currentPage===1?"disabled":""}
            title="First page"
          >
            ⟨⟨
          </button>

          <button
            class="pagination-btn prev-btn"
            ${this.currentPage===1?"disabled":""}
            title="Previous page"
          >
            ⟨
          </button>

          ${t.map(a=>a==="..."?'<button class="pagination-btn ellipsis" disabled>...</button>':`
              <button
                class="pagination-btn page-btn ${a===this.currentPage?"active":""}"
                data-page="${a}"
              >
                ${a}
              </button>
            `).join("")}

          <button
            class="pagination-btn next-btn"
            ${this.currentPage===this.totalPages?"disabled":""}
            title="Next page"
          >
            ⟩
          </button>

          <button
            class="pagination-btn last-btn"
            ${this.currentPage===this.totalPages?"disabled":""}
            title="Last page"
          >
            ⟩⟩
          </button>
        </div>

        ${this.showJump?`
          <div class="jump-container">
            <span>Go to:</span>
            <input
              type="number"
              class="jump-input"
              min="1"
              max="${this.totalPages}"
              placeholder="${this.currentPage}"
            >
          </div>
        `:""}
      </div>
    `,this.isConnected&&setTimeout(()=>this.setupEvents(),0)}}customElements.define("pan-pagination",g);var u=g;export{g as PanPagination,u as default};

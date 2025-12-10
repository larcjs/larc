import{PanClient as d}from"../../../core/pan-client.mjs";const l=()=>globalThis.crypto&&typeof crypto.randomUUID=="function"?crypto.randomUUID():`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;class s extends HTMLElement{pc=new d(this);items=[];connectedCallback(){this.attachShadow({mode:"open"}),this.#t(),this.pc.subscribe("todos.state",o=>{this.items=o.data.items,this.#t()},{retained:!0})}#t(){const o=String.raw;this.shadowRoot.innerHTML=o`
      <style>
        :host{display:block;font:15px/1.5 var(--font, "Lexend", sans-serif);}
        form{display:flex;gap:0.65rem;margin-bottom:0.9rem;}
        input{flex:1;padding:0.65rem 0.75rem;border-radius:0.8rem;border:1px solid rgba(15,23,42,0.12);}
        button{padding:0.65rem 1rem;border-radius:0.8rem;border:none;background:var(--color-accent,#2563eb);color:white;font-weight:600;cursor:pointer;}
        button:hover{background:#1d4ed8;}
        ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0.4rem;}
        li{display:flex;align-items:center;gap:0.75rem;padding:0.55rem 0.75rem;border:1px solid rgba(15,23,42,0.1);border-radius:0.9rem;background:rgba(255,255,255,0.9);}
        li.done .t{text-decoration:line-through;color:var(--color-muted,#5f6b84);}
        .muted{color:var(--color-muted,#5f6b84);}
        .spacer{flex:1;}
        .del{border:none;background:transparent;color:#ef4444;font-size:1.1rem;cursor:pointer;}
      </style>
      <form id="f">
        <input id="title" placeholder="Add a task…" />
        <button type="submit">Add</button>
      </form>
      ${this.items.length?"":'<div class="muted">No tasks yet.</div>'}
      <ul>
        ${this.items.map(t=>`
          <li class="${t.done?"done":""}" data-id="${t.id}">
            <input type="checkbox" ${t.done?"checked":""} aria-label="toggle" />
            <span class="t">${this.#e(t.title)}</span>
            <span class="spacer"></span>
            <button class="del" title="Remove">✕</button>
          </li>
        `).join("")}
      </ul>
    `;const r=this.shadowRoot.querySelector("#f"),a=this.shadowRoot.querySelector("#title");r?.addEventListener("submit",t=>{t.preventDefault();const e=a.value.trim();e&&(a.value="",this.pc.publish({topic:"todos.change",data:{item:{id:l(),title:e,done:!1}},retain:!0}))}),this.shadowRoot.querySelectorAll("li input[type=checkbox]").forEach(t=>{t.addEventListener("change",e=>{const i=e.target.closest("li")?.dataset.id;this.pc.publish({topic:"todos.toggle",data:{id:i,done:e.target.checked},retain:!0})})}),this.shadowRoot.querySelectorAll("li .del").forEach(t=>{t.addEventListener("click",e=>{const i=e.target.closest("li")?.dataset.id;this.pc.publish({topic:"todos.remove",data:{id:i},retain:!0})})})}#e(o){return String(o).replace(/[&<>"']/g,r=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[r])}}customElements.define("todo-list",s);var u=s;export{u as default};

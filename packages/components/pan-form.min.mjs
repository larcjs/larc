import{PanClient as o}from"../../../core/pan-client.mjs";class r extends HTMLElement{static get observedAttributes(){return["resource","fields","key","live"]}constructor(){super(),this.attachShadow({mode:"open"}),this.pc=new o(this),this.value={},this._offSel=null,this._offLive=null,this._selectedId=null,this._liveTopic=null}connectedCallback(){this.render(),this.#e()}disconnectedCallback(){this._unsubAll()}attributeChangedCallback(){this.render(),this.#e()}get resource(){return(this.getAttribute("resource")||"items").trim()}get fields(){const t=(this.getAttribute("fields")||"").trim();return t?t.split(/\s*,\s*/):[]}get key(){return(this.getAttribute("key")||"id").trim()}get live(){const t=(this.getAttribute("live")||"true").toLowerCase();return t!=="false"&&t!=="0"}#e(){this._unsubAll(),this._offSel=this.pc.subscribe(`${this.resource}.item.select`,async t=>{const e=t?.data?.id;if(e){this._selectedId=e,this.#s();try{const{data:i}=await this.pc.request(`${this.resource}.item.get`,{id:e});this.#t(i?.item||{})}catch{}}}),this.#i()}#i(){const t=this.shadowRoot.getElementById("f");t&&(t.onsubmit=i=>{i.preventDefault(),this.#r()});const e=this.shadowRoot.getElementById("del");e&&(e.onclick=i=>{i.preventDefault(),this.#l()})}_unsubAll(){try{this._offSel&&this._offSel()}catch{}this._offSel=null;try{this._offLive&&this._offLive()}catch{}this._offLive=null,this._liveTopic=null}#s(){if(!this.live)return;const t=this._selectedId||this.value?.[this.key]||this.value?.id;if(!t)return;const e=`${this.resource}.item.state.${t}`;if(!(this._liveTopic===e&&this._offLive)){try{this._offLive&&this._offLive()}catch{}this._offLive=null,this._liveTopic=e,this._offLive=this.pc.subscribe(e,i=>{const s=i?.data||{};if(s.deleted){const l=this.value?.[this.key]||this.value?.id;String(l)===String(t)&&this.#t({});return}if(s.item&&typeof s.item=="object"){this.#t(s.item);return}if(s.patch&&typeof s.patch=="object"){this.#t(Object.assign({},this.value||{},s.patch));return}s&&typeof s=="object"&&this.#t(Object.assign({},this.value||{},s))},{retained:!0})}}async#r(){const t=this.#o();try{const{data:e}=await this.pc.request(`${this.resource}.item.save`,{item:t}),i=e?.item||t;this.#t(i),this._selectedId=i?.[this.key]||i?.id||this._selectedId,this.#s()}catch{}}async#l(){const t=this.value?.id||this.value?.[this.key];if(t)try{await this.pc.request(`${this.resource}.item.delete`,{id:t}),this.#t({})}catch{}}#o(){const t=Object.assign({},this.value);for(const e of this.fields){const i=this.shadowRoot.querySelector(`[name="${e}"]`);if(!i)continue;const s=i.value;t[e]=s}return t}#t(t){this.value=t||{},this.render(),this.#i()}render(){const t=String.raw,e=this.value||{};this.shadowRoot.innerHTML=t`
      <style>
        :host{display:block; border:1px solid #ddd; border-radius:8px; padding:12px; font:13px/1.4 system-ui, sans-serif}
        form{ display:grid; gap:8px }
        label{ display:grid; gap:4px }
        input,button{ padding:8px 10px }
        .row{ display:flex; gap:8px; align-items:center }
        .spacer{ flex:1 }
      </style>
      <form id="f">
        ${this.fields.map(i=>`
          <label>
            <span>${i}</span>
            <input name="${i}" value="${this.#n(e[i]??"")}" />
          </label>`).join("")}
        <div class="row">
          <button id="save" type="submit">Save</button>
          <span class="spacer"></span>
          <button id="del" type="button">Delete</button>
        </div>
      </form>
    `}#n(t){return String(t).replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}}customElements.define("pan-form",r);var h=r;export{r as PanForm,h as default};

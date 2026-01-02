import{PanClient as u}from"../core/pan-client.mjs";class m extends HTMLElement{static get observedAttributes(){return["resource","schema","url","data","layout","auto-validate","show-reset"]}constructor(){super(),this.attachShadow({mode:"open"}),this.pc=new u(this),this.schema=null,this.formData={},this.initialData={},this.validationErrors={},this._offs=[]}escapeHTML(e){if(!e||typeof e!="string")return"";const t={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return e.replace(/[&<>"']/g,a=>t[a])}connectedCallback(){this.loadSchema(),this.setupTopics(),this.render()}disconnectedCallback(){this._offs.forEach(e=>e())}attributeChangedCallback(e,t,a){if(t!==a)if(e==="schema"&&a)try{this.schema=JSON.parse(a),this.render()}catch(r){console.error("[pan-json-form] Invalid schema JSON:",r)}else if(e==="data"&&a)try{this.formData=JSON.parse(a),this.initialData={...this.formData},this.render()}catch(r){console.error("[pan-json-form] Invalid data JSON:",r)}else this.isConnected&&this.render()}get resource(){return this.getAttribute("resource")||"form"}get layout(){return this.getAttribute("layout")||"vertical"}get autoValidate(){return this.hasAttribute("auto-validate")}get showReset(){return this.hasAttribute("show-reset")?this.getAttribute("show-reset")!=="false":!0}async loadSchema(){const e=this.getAttribute("url");if(e)try{const t=await fetch(e);this.schema=await t.json(),this.render()}catch(t){console.error("[pan-json-form] Failed to load schema from URL:",t)}}setupTopics(){this._offs.push(this.pc.subscribe(`${this.resource}.schema.set`,e=>{e.data.schema&&(this.schema=e.data.schema,this.render())})),this._offs.push(this.pc.subscribe(`${this.resource}.data.set`,e=>{e.data.data&&(this.formData={...e.data.data},this.updateFormValues())})),this._offs.push(this.pc.subscribe(`${this.resource}.data.get`,()=>{this.pc.publish({topic:`${this.resource}.data`,data:{data:this.formData}})})),this._offs.push(this.pc.subscribe(`${this.resource}.validate`,()=>{this.validate()})),this._offs.push(this.pc.subscribe(`${this.resource}.submit`,()=>{this.handleSubmit(new Event("submit"))})),this._offs.push(this.pc.subscribe(`${this.resource}.reset`,()=>{this.reset()}))}updateFormValues(){this.schema?.fields&&this.schema.fields.forEach(e=>{const t=this.shadowRoot.querySelector(`[name="${e.name}"]`);if(!t)return;const a=this.formData[e.name];e.type==="checkbox"?t.checked=!!a:e.type==="checkbox-group"||e.type==="radio"?this.shadowRoot.querySelectorAll(`[name="${e.name}"]`).forEach(s=>{Array.isArray(a)?s.checked=a.includes(s.value):s.checked=s.value===a}):t.value=a??""})}validate(){if(!this.schema?.fields)return!0;this.validationErrors={};let e=!0;return this.schema.fields.forEach(t=>{const a=this.formData[t.name],r=[];if(t.required&&!a&&(r.push(`${t.label||t.name} is required`),e=!1),a){if(t.type==="email"&&!this.isValidEmail(a)&&(r.push("Invalid email address"),e=!1),t.type==="number"){const s=Number(a);t.min!==void 0&&s<t.min&&(r.push(`Must be at least ${t.min}`),e=!1),t.max!==void 0&&s>t.max&&(r.push(`Must be at most ${t.max}`),e=!1)}t.minLength&&a.length<t.minLength&&(r.push(`Must be at least ${t.minLength} characters`),e=!1),t.maxLength&&a.length>t.maxLength&&(r.push(`Must be at most ${t.maxLength} characters`),e=!1),t.pattern&&!new RegExp(t.pattern).test(a)&&(r.push(t.patternMessage||"Invalid format"),e=!1)}r.length>0&&(this.validationErrors[t.name]=r)}),this.pc.publish({topic:`${this.resource}.validation`,data:{isValid:e,errors:this.validationErrors}}),this.renderErrors(),e}isValidEmail(e){return/^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{1,63}$/.test(e)}renderErrors(){Object.keys(this.validationErrors).forEach(e=>{const t=this.shadowRoot.querySelector(`#error-${e}`);t&&(t.innerHTML=this.validationErrors[e].map(a=>`<div class="error-message">${this.escapeHTML(a)}</div>`).join(""),t.style.display="block")}),this.schema?.fields&&this.schema.fields.forEach(e=>{if(!this.validationErrors[e.name]){const t=this.shadowRoot.querySelector(`#error-${e.name}`);t&&(t.innerHTML="",t.style.display="none")}})}handleInput(e){const t=this.schema.fields.find(r=>r.name===e.target.name);if(!t)return;let a;t.type==="checkbox"?a=e.target.checked:t.type==="checkbox-group"?a=Array.from(this.shadowRoot.querySelectorAll(`[name="${t.name}"]:checked`)).map(s=>s.value):t.type==="number"?a=e.target.value?Number(e.target.value):null:a=e.target.value,this.formData[t.name]=a,this.autoValidate&&this.validate(),this.pc.publish({topic:`${this.resource}.change`,data:{field:t.name,value:a,data:this.formData}})}handleSubmit(e){e.preventDefault();const t=this.validate();this.pc.publish({topic:`${this.resource}.submit`,data:{data:this.formData,isValid:t}})}reset(){this.formData={...this.initialData},this.validationErrors={},this.updateFormValues(),this.renderErrors()}renderField(e){const t=this.formData[e.name]??e.defaultValue??"",a=e.className||"",r=e.style?Object.entries(e.style).map(([i,c])=>`${i}: ${c}`).join("; "):"";let s="";switch(e.type){case"textarea":s=`
          <textarea
            name="${e.name}"
            class="${a}"
            style="${r}"
            rows="${e.rows||3}"
            placeholder="${e.placeholder||""}"
            ${e.required?"required":""}
            ${e.readonly?"readonly":""}
            ${e.maxLength?`maxlength="${e.maxLength}"`:""}
          >${t}</textarea>
        `;break;case"select":const i=(e.options||[]).map(o=>{const n=typeof o=="string"?o:o.value,l=typeof o=="string"?o:o.label;return`<option value="${n}" ${t===n?"selected":""}>${l}</option>`}).join("");s=`
          <select
            name="${e.name}"
            class="${a}"
            style="${r}"
            ${e.required?"required":""}
            ${e.readonly?"disabled":""}
          >
            ${e.placeholder?`<option value="">${e.placeholder}</option>`:""}
            ${i}
          </select>
        `;break;case"checkbox":return s=`
          <label class="checkbox-label">
            <input
              type="checkbox"
              name="${e.name}"
              class="${a}"
              style="${r}"
              value="true"
              ${t?"checked":""}
              ${e.readonly?"disabled":""}
            />
            <span>${e.label}</span>
          </label>
        `,`
          <div class="field-group" data-field="${e.name}">
            ${s}
            ${e.help?`<div class="help-text">${e.help}</div>`:""}
            <div id="error-${e.name}" class="error-container"></div>
          </div>
        `;case"checkbox-group":s=`<div class="checkbox-group">${(e.options||[]).map(o=>{const n=typeof o=="string"?o:o.value,l=typeof o=="string"?o:o.label,h=Array.isArray(t)&&t.includes(n);return`
            <label class="checkbox-label">
              <input
                type="checkbox"
                name="${e.name}"
                value="${n}"
                ${h?"checked":""}
                ${e.readonly?"disabled":""}
              />
              <span>${l}</span>
            </label>
          `}).join("")}</div>`;break;case"radio":s=`<div class="radio-group">${(e.options||[]).map(o=>{const n=typeof o=="string"?o:o.value,l=typeof o=="string"?o:o.label;return`
            <label class="radio-label">
              <input
                type="radio"
                name="${e.name}"
                value="${n}"
                ${t===n?"checked":""}
                ${e.readonly?"disabled":""}
              />
              <span>${l}</span>
            </label>
          `}).join("")}</div>`;break;default:s=`
          <input
            type="${e.type||"text"}"
            name="${e.name}"
            class="${a}"
            style="${r}"
            value="${t}"
            placeholder="${e.placeholder||""}"
            ${e.required?"required":""}
            ${e.readonly?"readonly":""}
            ${e.min!==void 0?`min="${e.min}"`:""}
            ${e.max!==void 0?`max="${e.max}"`:""}
            ${e.minLength?`minlength="${e.minLength}"`:""}
            ${e.maxLength?`maxlength="${e.maxLength}"`:""}
            ${e.pattern?`pattern="${e.pattern}"`:""}
          />
        `}return e.type==="checkbox"?s:`
      <div class="field-group" data-field="${e.name}">
        ${e.label?`<label class="field-label">${e.label}${e.required?' <span class="required">*</span>':""}</label>`:""}
        ${s}
        ${e.help?`<div class="help-text">${e.help}</div>`:""}
        <div id="error-${e.name}" class="error-container"></div>
      </div>
    `}render(){if(!this.schema?.fields){this.shadowRoot.innerHTML='<div class="no-schema">No form schema provided</div>';return}const e=`form-layout-${this.layout}`,t=this.schema.fields.map(r=>this.renderField(r)).join("");this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: block;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .form-container {
          width: 100%;
        }

        .form-layout-vertical .field-group {
          margin-bottom: 1.5rem;
        }

        .form-layout-horizontal .field-group {
          display: grid;
          grid-template-columns: 150px 1fr;
          gap: 1rem;
          align-items: start;
          margin-bottom: 1rem;
        }

        .form-layout-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .field-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: var(--color-text, #333);
        }

        .required {
          color: var(--color-danger, #e74c3c);
        }

        input[type="text"],
        input[type="email"],
        input[type="password"],
        input[type="number"],
        input[type="tel"],
        input[type="url"],
        input[type="date"],
        textarea,
        select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--color-border, #ddd);
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
          background: var(--color-surface, white);
          color: var(--color-text, inherit);
        }

        input:focus,
        textarea:focus,
        select:focus {
          outline: none;
          border-color: var(--color-primary, #3498db);
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
        }

        textarea {
          resize: vertical;
        }

        .checkbox-label,
        .radio-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          margin-bottom: 0.5rem;
        }

        .checkbox-group,
        .radio-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .help-text {
          margin-top: 0.25rem;
          font-size: 12px;
          color: var(--color-text-muted, #666);
        }

        .error-container {
          display: none;
          margin-top: 0.25rem;
        }

        .error-message {
          color: var(--color-danger, #e74c3c);
          font-size: 12px;
          margin-top: 0.25rem;
        }

        .form-actions {
          margin-top: 2rem;
          display: flex;
          gap: 1rem;
        }

        button {
          padding: 0.6rem 1.5rem;
          border: 1px solid var(--color-border, #ddd);
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--color-surface, white);
          color: var(--color-text, inherit);
        }

        button:hover {
          background: var(--color-surface-alt, #f5f5f5);
        }

        .btn-submit {
          background: var(--color-primary, #3498db);
          color: white;
          border-color: var(--color-primary, #3498db);
        }

        .btn-submit:hover {
          background: var(--color-primary-dark, #2980b9);
        }

        .btn-reset {
          background: var(--color-secondary, #95a5a6);
          color: white;
          border-color: var(--color-secondary, #95a5a6);
        }

        .btn-reset:hover {
          background: var(--color-secondary-light, #7f8c8d);
        }

        .no-schema {
          padding: 2rem;
          text-align: center;
          color: var(--color-text-muted, #999);
        }
      </style>

      <div class="form-container">
        <form class="${e}">
          ${t}
          
          <div class="form-actions">
            <button type="submit" class="btn-submit">Submit</button>
            ${this.showReset?'<button type="button" class="btn-reset">Reset</button>':""}
          </div>
        </form>
      </div>
    `;const a=this.shadowRoot.querySelector("form");if(a){a.addEventListener("submit",i=>this.handleSubmit(i)),a.querySelectorAll("input, textarea, select").forEach(i=>{i.addEventListener("input",c=>this.handleInput(c)),i.addEventListener("change",c=>this.handleInput(c))});const s=a.querySelector(".btn-reset");s&&s.addEventListener("click",()=>this.reset())}this.pc.publish({topic:`${this.resource}.ready`,data:{}})}}customElements.define("pan-json-form",m);export{m as PanJsonForm};

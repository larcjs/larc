import{PanClient as u}from"../../../core/pan-client.mjs";class m extends HTMLElement{static get observedAttributes(){return["resource","schema","url","data","layout","auto-validate","show-reset"]}constructor(){super(),this.attachShadow({mode:"open"}),this.pc=new u(this),this.schema=null,this.formData={},this.initialData={},this.validationErrors={},this._offs=[]}connectedCallback(){this.loadSchema(),this.setupTopics(),this.render()}disconnectedCallback(){this._offs.forEach(e=>e())}attributeChangedCallback(e,t,a){if(t!==a)if(e==="schema"&&a)try{this.schema=JSON.parse(a),this.render()}catch(s){console.error("[pan-json-form] Invalid schema JSON:",s)}else if(e==="data"&&a)try{this.formData=JSON.parse(a),this.initialData={...this.formData},this.render()}catch(s){console.error("[pan-json-form] Invalid data JSON:",s)}else this.isConnected&&this.render()}get resource(){return this.getAttribute("resource")||"form"}get layout(){return this.getAttribute("layout")||"vertical"}get autoValidate(){return this.hasAttribute("auto-validate")}get showReset(){return this.hasAttribute("show-reset")?this.getAttribute("show-reset")!=="false":!0}async loadSchema(){const e=this.getAttribute("url");if(e)try{const t=await fetch(e);this.schema=await t.json(),this.render()}catch(t){console.error("[pan-json-form] Failed to load schema from URL:",t)}}setupTopics(){this._offs.push(this.pc.subscribe(`${this.resource}.schema.set`,e=>{e.data.schema&&(this.schema=e.data.schema,this.render())})),this._offs.push(this.pc.subscribe(`${this.resource}.data.set`,e=>{e.data.data&&(this.formData={...e.data.data},this.updateFormValues())})),this._offs.push(this.pc.subscribe(`${this.resource}.data.get`,()=>{this.pc.publish({topic:`${this.resource}.data`,data:{data:this.formData}})})),this._offs.push(this.pc.subscribe(`${this.resource}.validate`,()=>{this.validate()})),this._offs.push(this.pc.subscribe(`${this.resource}.submit`,()=>{this.handleSubmit(new Event("submit"))})),this._offs.push(this.pc.subscribe(`${this.resource}.reset`,()=>{this.reset()}))}updateFormValues(){this.schema?.fields&&this.schema.fields.forEach(e=>{const t=this.shadowRoot.querySelector(`[name="${e.name}"]`);if(!t)return;const a=this.formData[e.name];e.type==="checkbox"?t.checked=!!a:e.type==="checkbox-group"||e.type==="radio"?this.shadowRoot.querySelectorAll(`[name="${e.name}"]`).forEach(r=>{Array.isArray(a)?r.checked=a.includes(r.value):r.checked=r.value===a}):t.value=a??""})}validate(){if(!this.schema?.fields)return!0;this.validationErrors={};let e=!0;return this.schema.fields.forEach(t=>{const a=this.formData[t.name],s=[];if(t.required&&!a&&(s.push(`${t.label||t.name} is required`),e=!1),a){if(t.type==="email"&&!this.isValidEmail(a)&&(s.push("Invalid email address"),e=!1),t.type==="number"){const r=Number(a);t.min!==void 0&&r<t.min&&(s.push(`Must be at least ${t.min}`),e=!1),t.max!==void 0&&r>t.max&&(s.push(`Must be at most ${t.max}`),e=!1)}t.minLength&&a.length<t.minLength&&(s.push(`Must be at least ${t.minLength} characters`),e=!1),t.maxLength&&a.length>t.maxLength&&(s.push(`Must be at most ${t.maxLength} characters`),e=!1),t.pattern&&!new RegExp(t.pattern).test(a)&&(s.push(t.patternMessage||"Invalid format"),e=!1)}s.length>0&&(this.validationErrors[t.name]=s)}),this.pc.publish({topic:`${this.resource}.validation`,data:{isValid:e,errors:this.validationErrors}}),this.renderErrors(),e}isValidEmail(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}renderErrors(){Object.keys(this.validationErrors).forEach(e=>{const t=this.shadowRoot.querySelector(`#error-${e}`);t&&(t.innerHTML=this.validationErrors[e].map(a=>`<div class="error-message">${a}</div>`).join(""),t.style.display="block")}),this.schema?.fields&&this.schema.fields.forEach(e=>{if(!this.validationErrors[e.name]){const t=this.shadowRoot.querySelector(`#error-${e.name}`);t&&(t.innerHTML="",t.style.display="none")}})}handleInput(e){const t=this.schema.fields.find(s=>s.name===e.target.name);if(!t)return;let a;t.type==="checkbox"?a=e.target.checked:t.type==="checkbox-group"?a=Array.from(this.shadowRoot.querySelectorAll(`[name="${t.name}"]:checked`)).map(r=>r.value):t.type==="number"?a=e.target.value?Number(e.target.value):null:a=e.target.value,this.formData[t.name]=a,this.autoValidate&&this.validate(),this.pc.publish({topic:`${this.resource}.change`,data:{field:t.name,value:a,data:this.formData}})}handleSubmit(e){e.preventDefault();const t=this.validate();this.pc.publish({topic:`${this.resource}.submit`,data:{data:this.formData,isValid:t}})}reset(){this.formData={...this.initialData},this.validationErrors={},this.updateFormValues(),this.renderErrors()}renderField(e){const t=this.formData[e.name]??e.defaultValue??"",a=e.className||"",s=e.style?Object.entries(e.style).map(([i,c])=>`${i}: ${c}`).join("; "):"";let r="";switch(e.type){case"textarea":r=`
          <textarea
            name="${e.name}"
            class="${a}"
            style="${s}"
            rows="${e.rows||3}"
            placeholder="${e.placeholder||""}"
            ${e.required?"required":""}
            ${e.readonly?"readonly":""}
            ${e.maxLength?`maxlength="${e.maxLength}"`:""}
          >${t}</textarea>
        `;break;case"select":const i=(e.options||[]).map(o=>{const n=typeof o=="string"?o:o.value,h=typeof o=="string"?o:o.label;return`<option value="${n}" ${t===n?"selected":""}>${h}</option>`}).join("");r=`
          <select
            name="${e.name}"
            class="${a}"
            style="${s}"
            ${e.required?"required":""}
            ${e.readonly?"disabled":""}
          >
            ${e.placeholder?`<option value="">${e.placeholder}</option>`:""}
            ${i}
          </select>
        `;break;case"checkbox":return r=`
          <label class="checkbox-label">
            <input
              type="checkbox"
              name="${e.name}"
              class="${a}"
              style="${s}"
              value="true"
              ${t?"checked":""}
              ${e.readonly?"disabled":""}
            />
            <span>${e.label}</span>
          </label>
        `,`
          <div class="field-group" data-field="${e.name}">
            ${r}
            ${e.help?`<div class="help-text">${e.help}</div>`:""}
            <div id="error-${e.name}" class="error-container"></div>
          </div>
        `;case"checkbox-group":r=`<div class="checkbox-group">${(e.options||[]).map(o=>{const n=typeof o=="string"?o:o.value,h=typeof o=="string"?o:o.label,l=Array.isArray(t)&&t.includes(n);return`
            <label class="checkbox-label">
              <input
                type="checkbox"
                name="${e.name}"
                value="${n}"
                ${l?"checked":""}
                ${e.readonly?"disabled":""}
              />
              <span>${h}</span>
            </label>
          `}).join("")}</div>`;break;case"radio":r=`<div class="radio-group">${(e.options||[]).map(o=>{const n=typeof o=="string"?o:o.value,h=typeof o=="string"?o:o.label;return`
            <label class="radio-label">
              <input
                type="radio"
                name="${e.name}"
                value="${n}"
                ${t===n?"checked":""}
                ${e.readonly?"disabled":""}
              />
              <span>${h}</span>
            </label>
          `}).join("")}</div>`;break;default:r=`
          <input
            type="${e.type||"text"}"
            name="${e.name}"
            class="${a}"
            style="${s}"
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
        `}return e.type==="checkbox"?r:`
      <div class="field-group" data-field="${e.name}">
        ${e.label?`<label class="field-label">${e.label}${e.required?' <span class="required">*</span>':""}</label>`:""}
        ${r}
        ${e.help?`<div class="help-text">${e.help}</div>`:""}
        <div id="error-${e.name}" class="error-container"></div>
      </div>
    `}render(){if(!this.schema?.fields){this.shadowRoot.innerHTML='<div class="no-schema">No form schema provided</div>';return}const e=`form-layout-${this.layout}`,t=this.schema.fields.map(s=>this.renderField(s)).join("");this.shadowRoot.innerHTML=`
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
          color: #333;
        }

        .required {
          color: #e74c3c;
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
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
        }

        input:focus,
        textarea:focus,
        select:focus {
          outline: none;
          border-color: #3498db;
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
          color: #666;
        }

        .error-container {
          display: none;
          margin-top: 0.25rem;
        }

        .error-message {
          color: #e74c3c;
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
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-submit {
          background: #3498db;
          color: white;
        }

        .btn-submit:hover {
          background: #2980b9;
        }

        .btn-reset {
          background: #95a5a6;
          color: white;
        }

        .btn-reset:hover {
          background: #7f8c8d;
        }

        .no-schema {
          padding: 2rem;
          text-align: center;
          color: #999;
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
    `;const a=this.shadowRoot.querySelector("form");if(a){a.addEventListener("submit",i=>this.handleSubmit(i)),a.querySelectorAll("input, textarea, select").forEach(i=>{i.addEventListener("input",c=>this.handleInput(c)),i.addEventListener("change",c=>this.handleInput(c))});const r=a.querySelector(".btn-reset");r&&r.addEventListener("click",()=>this.reset())}this.pc.publish({topic:`${this.resource}.ready`,data:{}})}}customElements.define("pan-json-form",m);export{m as PanJsonForm};

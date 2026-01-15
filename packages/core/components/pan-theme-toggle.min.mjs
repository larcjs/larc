class s extends HTMLElement{static observedAttributes=["label","variant"];constructor(){super(),this.attachShadow({mode:"open"}),this._currentTheme="auto",this._effectiveTheme="light"}async connectedCallback(){this._initializeThemeState(),this.render(),await this._waitForProvider(),this._setupPanListeners(),this._requestCurrentTheme()}disconnectedCallback(){this._teardownPanListeners()}attributeChangedCallback(e,t,o){t!==o&&this.render()}render(){const e=this.getAttribute("variant")||"icon",t=this.getAttribute("label")||"";this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: inline-block;
        }

        .toggle-container {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        /* Default light mode colors */
        button {
          background: var(--color-surface, var(--color-bg, #ffffff));
          border: 1px solid var(--color-border, #e2e8f0);
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--color-text, #1e293b);
          font-family: var(--font-sans, system-ui);
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }

        button:hover {
          background: var(--color-bg-alt, #f8fafc);
          border-color: var(--color-border-strong, var(--color-border, #cbd5e1));
        }

        /* Dark mode defaults - system preference or manual override */
        @media (prefers-color-scheme: dark) {
          button {
            background: var(--color-surface, var(--color-bg, #1e293b));
            border-color: var(--color-border, #334155);
            color: var(--color-text, #f1f5f9);
          }

          button:hover {
            background: var(--color-bg-alt, #334155);
            border-color: var(--color-border-strong, #475569);
          }
        }

        /* Dark mode - manual override via data-theme attribute */
        :host-context([data-theme="dark"]) button {
          background: var(--color-surface, var(--color-bg, #1e293b));
          border-color: var(--color-border, #334155);
          color: var(--color-text, #f1f5f9);
        }

        :host-context([data-theme="dark"]) button:hover {
          background: var(--color-bg-alt, #334155);
          border-color: var(--color-border-strong, #475569);
        }

        /* Light mode - manual override via data-theme attribute (to override system dark) */
        :host-context([data-theme="light"]) button {
          background: var(--color-surface, var(--color-bg, #ffffff));
          border-color: var(--color-border, #e2e8f0);
          color: var(--color-text, #1e293b);
        }

        :host-context([data-theme="light"]) button:hover {
          background: var(--color-bg-alt, #f8fafc);
          border-color: var(--color-border-strong, var(--color-border, #cbd5e1));
        }

        button:active {
          transform: scale(0.98);
        }

        .icon {
          width: 1.25rem;
          height: 1.25rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .label {
          font-weight: 500;
        }

        /* Icon-only variant */
        .icon-only {
          padding: 0.5rem;
        }

        /* Dropdown variant */
        .dropdown {
          position: relative;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.5rem;
          background: var(--color-surface, var(--color-bg, #ffffff));
          border: 1px solid var(--color-border, #e2e8f0);
          border-radius: 0.5rem;
          box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
          padding: 0.5rem;
          min-width: 150px;
          z-index: 1000;
          display: none;
        }

        @media (prefers-color-scheme: dark) {
          .dropdown-menu {
            background: var(--color-surface, var(--color-bg, #1e293b));
            border-color: var(--color-border, #334155);
            box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.5));
          }
        }

        :host-context([data-theme="dark"]) .dropdown-menu {
          background: var(--color-surface, var(--color-bg, #1e293b));
          border-color: var(--color-border, #334155);
          box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.5));
        }

        :host-context([data-theme="light"]) .dropdown-menu {
          background: var(--color-surface, var(--color-bg, #ffffff));
          border-color: var(--color-border, #e2e8f0);
          box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
        }

        .dropdown-menu.open {
          display: block;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: background 0.15s ease;
          color: var(--color-text, #1e293b);
        }

        @media (prefers-color-scheme: dark) {
          .dropdown-item {
            color: var(--color-text, #f1f5f9);
          }
        }

        :host-context([data-theme="dark"]) .dropdown-item {
          color: var(--color-text, #f1f5f9);
        }

        :host-context([data-theme="light"]) .dropdown-item {
          color: var(--color-text, #1e293b);
        }

        .dropdown-item:hover {
          background: var(--color-bg-alt, #f8fafc);
        }

        @media (prefers-color-scheme: dark) {
          .dropdown-item:hover {
            background: var(--color-bg-alt, #334155);
          }
        }

        :host-context([data-theme="dark"]) .dropdown-item:hover {
          background: var(--color-bg-alt, #334155);
        }

        :host-context([data-theme="light"]) .dropdown-item:hover {
          background: var(--color-bg-alt, #f8fafc);
        }

        .dropdown-item.active {
          background: var(--color-primary-soft, #cce6f5);
          color: var(--color-primary, #006699);
          font-weight: 500;
        }

        @media (prefers-color-scheme: dark) {
          .dropdown-item.active {
            background: var(--color-primary-soft, rgba(94, 234, 212, 0.2));
            color: var(--color-primary, #5eead4);
          }
        }

        :host-context([data-theme="dark"]) .dropdown-item.active {
          background: var(--color-primary-soft, rgba(94, 234, 212, 0.2));
          color: var(--color-primary, #5eead4);
        }

        :host-context([data-theme="light"]) .dropdown-item.active {
          background: var(--color-primary-soft, #cce6f5);
          color: var(--color-primary, #006699);
        }

        /* Theme icons */
        .theme-icon {
          width: 1rem;
          height: 1rem;
        }
      </style>
      <div class="toggle-container">
        ${e==="dropdown"?this._renderDropdown():this._renderButton(t,e)}
      </div>
    `,this._attachEventListeners()}_renderButton(e,t){const o=t==="icon"?"icon-only":"",a=this._getThemeIcon(this._effectiveTheme);return`
      <button class="toggle-btn ${o}" aria-label="Toggle theme">
        <span class="icon">${a}</span>
        ${e?`<span class="label">${e}</span>`:""}
      </button>
    `}_renderDropdown(){return`
      <div class="dropdown">
        <button class="toggle-btn dropdown-trigger" aria-label="Toggle theme">
          <span class="icon">${this._getThemeIcon(this._effectiveTheme)}</span>
        </button>
        <div class="dropdown-menu">
          <div class="dropdown-item" data-theme="light">
            <span class="theme-icon">${this._getThemeIcon("light")}</span>
            <span>Light</span>
          </div>
          <div class="dropdown-item" data-theme="dark">
            <span class="theme-icon">${this._getThemeIcon("dark")}</span>
            <span>Dark</span>
          </div>
          <div class="dropdown-item" data-theme="auto">
            <span class="theme-icon">${this._getThemeIcon("auto")}</span>
            <span>Auto</span>
          </div>
        </div>
      </div>
    `}_getThemeIcon(e){const t={light:`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>`,dark:`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
      </svg>`,auto:`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="20" height="20">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
      </svg>`};return t[e]||t.auto}_attachEventListeners(){if((this.getAttribute("variant")||"icon")==="dropdown"){const t=this.shadowRoot.querySelector(".dropdown-trigger"),o=this.shadowRoot.querySelector(".dropdown-menu"),a=this.shadowRoot.querySelectorAll(".dropdown-item");t?.addEventListener("click",r=>{r.stopPropagation(),o?.classList.toggle("open")}),a.forEach(r=>{r.addEventListener("click",c=>{const n=r.dataset.theme;n&&(this._setTheme(n),o?.classList.remove("open"))})}),document.addEventListener("click",()=>{o?.classList.remove("open")}),this._updateDropdownActiveState()}else this.shadowRoot.querySelector(".toggle-btn")?.addEventListener("click",()=>this._cycleTheme())}_cycleTheme(){const t={auto:"light",light:"dark",dark:"auto"}[this._currentTheme]||"auto";this._setTheme(t)}_setTheme(e){const t=this._getThemeProvider();if(t)t.setTheme(e);else{this._saveThemeToStorage(e);const o=e==="auto"?this._getSystemTheme():e;document.documentElement.setAttribute("data-theme",o),this._currentTheme=e,this._effectiveTheme=o,this.render()}}_requestCurrentTheme(){const e=this._getThemeProvider();e&&(this._currentTheme=e.getTheme(),this._effectiveTheme=e.getEffectiveTheme(),this.render())}_getThemeProvider(){return document.querySelector("pan-theme-provider")}_setupPanListeners(){const e=document.querySelector("pan-bus");e&&(this._themeChangedHandler=t=>{this._currentTheme=t.theme,this._effectiveTheme=t.effective,this.render()},e.subscribe("theme.changed",this._themeChangedHandler))}_teardownPanListeners(){const e=document.querySelector("pan-bus");e&&this._themeChangedHandler&&e.unsubscribe("theme.changed",this._themeChangedHandler)}_updateDropdownActiveState(){this.shadowRoot.querySelectorAll(".dropdown-item").forEach(t=>{t.dataset.theme===this._currentTheme?t.classList.add("active"):t.classList.remove("active")})}_initializeThemeState(){const e="larc-theme-preference",t=this._loadThemeFromStorage(),o=document.documentElement.getAttribute("data-theme");t&&["light","dark","auto"].includes(t)?(this._currentTheme=t,this._effectiveTheme=t==="auto"?this._getSystemTheme():t):o?(this._currentTheme=o,this._effectiveTheme=o):(this._currentTheme="auto",this._effectiveTheme=this._getSystemTheme())}_loadThemeFromStorage(){const e="larc-theme-preference";try{return localStorage.getItem(e)}catch{return null}}_saveThemeToStorage(e){const t="larc-theme-preference";try{localStorage.setItem(t,e)}catch(o){console.warn("[pan-theme-toggle] Could not save theme to localStorage:",o)}}_getSystemTheme(){return typeof window>"u"?"light":window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}async _waitForProvider(){try{await Promise.race([customElements.whenDefined("pan-theme-provider"),new Promise(e=>setTimeout(e,2e3))])}catch{console.warn("[pan-theme-toggle] Provider not available, using fallback mode")}}}customElements.define("pan-theme-toggle",s);export{s as PanThemeToggle};

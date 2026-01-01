class o extends HTMLElement{static get observedAttributes(){return["name","image","size","status","show-status","color"]}constructor(){super(),this.attachShadow({mode:"open"})}connectedCallback(){this.render()}attributeChangedCallback(){this.isConnected&&this.render()}get name(){return this.getAttribute("name")||""}get image(){return this.getAttribute("image")||""}get size(){return this.getAttribute("size")||"md"}get status(){return this.getAttribute("status")||""}get showStatus(){return this.hasAttribute("show-status")}get color(){return this.getAttribute("color")||""}getInitials(t){if(!t)return"?";const e=t.trim().split(/\s+/);return e.length>=2?(e[0][0]+e[e.length-1][0]).toUpperCase():t.slice(0,2).toUpperCase()}getColorFromName(t){if(!t)return"#94a3b8";let e=0;for(let s=0;s<t.length;s++)e=t.charCodeAt(s)+((e<<5)-e);return`hsl(${e%360}, 65%, 55%)`}escapeHTML(t){if(!t||typeof t!="string")return"";const e={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return t.replace(/[&<>"']/g,i=>e[i])}render(){const t=this.querySelector("[slot]")||this.textContent.trim(),e=this.escapeHTML(this.getInitials(this.name)),i=this.color||this.getColorFromName(this.name),s=["xs","sm","md","lg","xl"],n=["online","offline","away","busy"],h=s.includes(this.size)?this.size:"md",a=n.includes(this.status)?this.status:"",l=this.escapeHTML(this.name),r=this.escapeHTML(this.image);this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: inline-block;
          position: relative;
        }

        .avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          overflow: hidden;
          background: ${i};
          color: white;
          font-weight: 700;
          user-select: none;
          position: relative;
        }

        .avatar.size-xs {
          width: 24px;
          height: 24px;
          font-size: 0.625rem;
        }

        .avatar.size-sm {
          width: 32px;
          height: 32px;
          font-size: 0.75rem;
        }

        .avatar.size-md {
          width: 40px;
          height: 40px;
          font-size: 0.875rem;
        }

        .avatar.size-lg {
          width: 56px;
          height: 56px;
          font-size: 1.25rem;
        }

        .avatar.size-xl {
          width: 80px;
          height: 80px;
          font-size: 1.75rem;
        }

        .avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .status-indicator {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 28%;
          height: 28%;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
        }

        .status-online {
          background: #10b981;
        }

        .status-offline {
          background: #94a3b8;
        }

        .status-away {
          background: #f59e0b;
        }

        .status-busy {
          background: #ef4444;
        }
      </style>

      <div class="avatar size-${h}">
        ${r?`
          <img src="${r}" alt="${l}" class="avatar-image">
        `:t?`
          <slot></slot>
        `:`
          ${e}
        `}
        ${this.showStatus&&a?`
          <div class="status-indicator status-${a}"></div>
        `:""}
      </div>
    `}}customElements.define("user-avatar",o);var c=o;export{o as UserAvatar,c as default};

import{PanClient as v}from"../../../core/pan-client.mjs";class u extends HTMLElement{static get observedAttributes(){return["value","format","min","max","topic","placeholder"]}constructor(){super(),this.attachShadow({mode:"open"}),this.pc=new v(this),this.isOpen=!1,this.currentMonth=new Date,this.selectedDate=null,this.eventsSetup=!1}connectedCallback(){this.value&&(this.selectedDate=new Date(this.value),this.currentMonth=new Date(this.selectedDate)),this.setupTopics(),this.render()}attributeChangedCallback(e,t,r){e==="value"&&r&&!this.isOpen&&(this.selectedDate=new Date(r),this.currentMonth=new Date(this.selectedDate)),this.isConnected&&this.render()}get value(){return this.getAttribute("value")||""}set value(e){this.setAttribute("value",e)}get format(){return this.getAttribute("format")||"YYYY-MM-DD"}get min(){return this.getAttribute("min")?new Date(this.getAttribute("min")):null}get max(){return this.getAttribute("max")?new Date(this.getAttribute("max")):null}get topic(){return this.getAttribute("topic")||"datepicker"}get placeholder(){return this.getAttribute("placeholder")||"Select date"}setupTopics(){this.pc.subscribe(`${this.topic}.setValue`,e=>{e.data.date&&this.selectDate(new Date(e.data.date))})}setupEvents(){if(this.eventsSetup)return;this.eventsSetup=!0;const e=this.shadowRoot.querySelector(".date-input"),t=this.shadowRoot.querySelector(".calendar"),r=this.shadowRoot.querySelector(".prev-month"),s=this.shadowRoot.querySelector(".next-month"),d=this.shadowRoot.querySelector(".today-btn"),o=this.shadowRoot.querySelector(".clear-btn");e&&(e.addEventListener("click",()=>this.toggleCalendar()),e.addEventListener("focus",()=>this.openCalendar())),r&&r.addEventListener("click",()=>this.changeMonth(-1)),s&&s.addEventListener("click",()=>this.changeMonth(1)),d&&d.addEventListener("click",()=>this.selectDate(new Date)),o&&o.addEventListener("click",n=>{n.stopPropagation(),this.selectDate(null)}),this.shadowRoot.querySelectorAll(".day-cell[data-date]").forEach(n=>{n.addEventListener("click",()=>{const i=new Date(n.dataset.date);this.selectDate(i)})}),this.handleOutsideClick=n=>{!this.contains(n.target)&&this.isOpen&&this.closeCalendar()},document.addEventListener("click",this.handleOutsideClick)}disconnectedCallback(){document.removeEventListener("click",this.handleOutsideClick)}toggleCalendar(){this.isOpen?this.closeCalendar():this.openCalendar()}openCalendar(){this.isOpen=!0;const e=this.shadowRoot.querySelector(".calendar");e&&e.classList.add("active")}closeCalendar(){this.isOpen=!1;const e=this.shadowRoot.querySelector(".calendar");e&&e.classList.remove("active")}changeMonth(e){this.currentMonth=new Date(this.currentMonth.getFullYear(),this.currentMonth.getMonth()+e,1),this.renderCalendar()}selectDate(e){if(this.selectedDate=e,e){const t=this.toISODate(e);this.value=t,this.pc.publish({topic:`${this.topic}.change`,data:{date:t,formatted:this.formatDate(e)}})}else this.value="",this.pc.publish({topic:`${this.topic}.change`,data:{date:null,formatted:""}});this.closeCalendar(),this.render()}toISODate(e){return e.toISOString().split("T")[0]}formatDate(e){if(!e)return"";const t=e.getFullYear(),r=String(e.getMonth()+1).padStart(2,"0"),s=String(e.getDate()).padStart(2,"0");return this.format.replace("YYYY",t).replace("MM",r).replace("DD",s).replace("M",e.getMonth()+1).replace("D",e.getDate())}isDateDisabled(e){return!!(this.min&&e<this.min||this.max&&e>this.max)}getDaysInMonth(e,t){return new Date(e,t+1,0).getDate()}getFirstDayOfMonth(e,t){return new Date(e,t,1).getDay()}renderCalendar(){const e=this.currentMonth.getFullYear(),t=this.currentMonth.getMonth(),r=this.getDaysInMonth(e,t),s=this.getFirstDayOfMonth(e,t),d=["January","February","March","April","May","June","July","August","September","October","November","December"],o=this.shadowRoot.querySelector(".calendar-grid"),n=this.shadowRoot.querySelector(".month-display");if(n&&(n.textContent=`${d[t]} ${e}`),!o)return;let i='<div class="weekdays">';["Su","Mo","Tu","We","Th","Fr","Sa"].forEach(a=>{i+=`<div class="weekday">${a}</div>`}),i+='</div><div class="days">';for(let a=0;a<s;a++)i+='<div class="day-cell empty"></div>';for(let a=1;a<=r;a++){const l=new Date(e,t,a),h=this.toISODate(l),p=this.selectedDate&&this.toISODate(this.selectedDate)===h,f=this.toISODate(new Date)===h,b=this.isDateDisabled(l);let c="day-cell";p&&(c+=" selected"),f&&(c+=" today"),b&&(c+=" disabled"),i+=`<div class="${c}" data-date="${h}">${a}</div>`}i+="</div>",o.innerHTML=i,setTimeout(()=>{this.shadowRoot.querySelectorAll(".day-cell[data-date]").forEach(a=>{a.addEventListener("click",()=>{const l=new Date(a.dataset.date);this.isDateDisabled(l)||this.selectDate(l)})})},0)}render(){this.eventsSetup=!1;const e=this.selectedDate?this.formatDate(this.selectedDate):"";this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: inline-block;
          position: relative;
        }

        .date-input-wrapper {
          position: relative;
        }

        .date-input {
          width: 100%;
          padding: 0.625rem 2.5rem 0.625rem 0.75rem;
          border: 1px solid var(--date-border, #e2e8f0);
          border-radius: 0.5rem;
          font-family: inherit;
          font-size: 0.95rem;
          background: var(--date-bg, #ffffff);
          color: var(--date-color, #1e293b);
          cursor: pointer;
          transition: all 0.2s;
        }

        .date-input:focus {
          outline: none;
          border-color: var(--date-focus-border, #6366f1);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .date-input.empty {
          color: var(--date-placeholder-color, #94a3b8);
        }

        .input-icons {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          gap: 0.25rem;
        }

        .icon-btn {
          display: flex;
          align-items: center;
          padding: 0.25rem;
          border: none;
          background: transparent;
          cursor: pointer;
          color: var(--date-icon-color, #64748b);
          font-size: 0.875rem;
          transition: color 0.2s;
        }

        .icon-btn:hover {
          color: var(--date-icon-hover, #1e293b);
        }

        .calendar {
          position: absolute;
          top: calc(100% + 0.5rem);
          left: 0;
          background: var(--calendar-bg, #ffffff);
          border: 1px solid var(--calendar-border, #e2e8f0);
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          padding: 1rem;
          z-index: 100;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.2s;
          min-width: 280px;
        }

        .calendar.active {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .month-display {
          font-weight: 600;
          color: var(--calendar-header-color, #1e293b);
        }

        .month-nav {
          display: flex;
          gap: 0.5rem;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          border-radius: 0.375rem;
          cursor: pointer;
          color: var(--calendar-nav-color, #64748b);
          transition: all 0.2s;
        }

        .nav-btn:hover {
          background: var(--calendar-nav-hover, #f1f5f9);
          color: var(--calendar-nav-hover-color, #1e293b);
        }

        .weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.25rem;
          margin-bottom: 0.5rem;
        }

        .weekday {
          text-align: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--calendar-weekday-color, #64748b);
          padding: 0.25rem;
        }

        .days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.25rem;
        }

        .day-cell {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.875rem;
          color: var(--calendar-day-color, #1e293b);
          transition: all 0.2s;
        }

        .day-cell:not(.empty):not(.disabled):hover {
          background: var(--calendar-day-hover, #f1f5f9);
        }

        .day-cell.empty {
          cursor: default;
        }

        .day-cell.today {
          font-weight: 600;
          color: var(--calendar-today-color, #6366f1);
        }

        .day-cell.selected {
          background: var(--calendar-selected-bg, #6366f1);
          color: white;
          font-weight: 600;
        }

        .day-cell.disabled {
          color: var(--calendar-disabled-color, #cbd5e1);
          cursor: not-allowed;
        }

        .calendar-footer {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--calendar-border, #e2e8f0);
        }

        .footer-btn {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid var(--calendar-border, #e2e8f0);
          background: transparent;
          border-radius: 0.375rem;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.875rem;
          color: var(--calendar-btn-color, #64748b);
          transition: all 0.2s;
        }

        .footer-btn:hover {
          background: var(--calendar-btn-hover, #f1f5f9);
          border-color: var(--calendar-btn-hover-border, #cbd5e1);
        }
      </style>

      <div class="date-input-wrapper">
        <input
          type="text"
          class="date-input ${e?"":"empty"}"
          value="${e}"
          placeholder="${this.placeholder}"
          readonly
        >
        <div class="input-icons">
          ${e?'<button class="icon-btn clear-btn" title="Clear">✕</button>':""}
          <span class="icon-btn">📅</span>
        </div>
      </div>

      <div class="calendar">
        <div class="calendar-header">
          <span class="month-display"></span>
          <div class="month-nav">
            <button class="nav-btn prev-month">‹</button>
            <button class="nav-btn next-month">›</button>
          </div>
        </div>
        <div class="calendar-grid"></div>
        <div class="calendar-footer">
          <button class="footer-btn today-btn">Today</button>
        </div>
      </div>
    `,this.renderCalendar(),this.isConnected&&setTimeout(()=>this.setupEvents(),0)}}customElements.define("pan-date-picker",u);var y=u;export{u as PanDatePicker,y as default};

import{PanClient as l}from"../../../core/src/components/pan-client.mjs";class r extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.pc=new l(this),this.events=[],this.retainedMessages=new Map,this.subscriptions=new Map,this.paused=!1,this.filter="",this.viewMode="messages",this.messageTypeFilter="all",this.stats={totalMessages:0,messagesByTopic:new Map,averageSize:0,totalSize:0}}connectedCallback(){this.render(),this.off=this.pc.subscribe("*",e=>{const t=performance.now();if(!this.paused){const i={ts:Date.now(),topic:e.topic,msg:e,size:JSON.stringify(e).length,retained:e.retained||!1,duration:0};this.events.push(i),this.events.length>1e3&&this.events.shift(),e.retained&&this.retainedMessages.set(e.topic,i),this.stats.totalMessages++;const s=this.stats.messagesByTopic.get(e.topic)||0;this.stats.messagesByTopic.set(e.topic,s+1),this.stats.totalSize+=i.size,this.stats.averageSize=this.stats.totalSize/this.stats.totalMessages,i.duration=performance.now()-t,this.viewMode==="messages"?this.renderRows():this.viewMode==="state"?this.renderStateTree():this.viewMode==="metrics"&&this.renderMetrics()}}),this._trackSubscriptions(),this.shadowRoot.addEventListener("input",e=>{const t=e.target;t&&t.id==="filter"&&(this.filter=t.value,this._updateView()),t&&t.id==="messageTypeFilter"&&(this.messageTypeFilter=t.value,this._updateView())}),this.shadowRoot.addEventListener("click",e=>{const t=e.target;if(t&&t.id==="pause"&&(this.paused=!this.paused,this.renderControls()),t&&t.id==="clear"&&(this.events=[],this.stats={totalMessages:0,messagesByTopic:new Map,averageSize:0,totalSize:0},this._updateView()),t&&t.id==="clearState"&&(this.retainedMessages.clear(),this.renderStateTree()),t&&t.id==="export"&&this._exportState(),t&&t.id==="import"&&this._importState(),t&&t.classList&&t.classList.contains("replay")){const i=Number(t.getAttribute("data-i")),s=this.events[i];s&&this.pc.publish(s.topic,s.msg.data,{retain:s.retained})}if(t&&t.classList&&t.classList.contains("inspect-msg")){const i=Number(t.getAttribute("data-i")),s=this.events[i];s&&this._showMessageDetails(s)}if(t&&t.classList&&t.classList.contains("inspect-state")){const i=t.getAttribute("data-topic"),s=this.retainedMessages.get(i);s&&this._showMessageDetails(s)}if(t&&t.classList&&t.classList.contains("tab-btn")){const i=t.getAttribute("data-mode");this.viewMode=i,this._updateView()}if(t&&t.id==="closeDetails"&&this._hideMessageDetails(),t&&t.classList&&t.classList.contains("tree-toggle")){const i=t.closest("tr");i&&(i.classList.toggle("expanded"),this.renderStateTree())}})}disconnectedCallback(){this.off&&this.off()}_trackSubscriptions(){setInterval(()=>{const e=new Set(this.events.slice(-100).map(t=>t.topic));for(const t of e)this.subscriptions.has(t)||this.subscriptions.set(t,1)},5e3)}_updateView(){this.render()}render(){const e=String.raw;this.shadowRoot.innerHTML=e`
      <style>
        :host{display:block; font:12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; height: 100%; display: flex; flex-direction: column;}
        header{display:flex; gap:8px; align-items:center; padding: 8px; background: #f8f8f8; border-bottom: 1px solid #ddd;}
        .tabs {display: flex; gap: 4px; margin-right: auto;}
        .tab-btn {padding: 6px 12px; border: none; background: transparent; cursor: pointer; border-bottom: 2px solid transparent;}
        .tab-btn.active {border-bottom-color: #007bff; font-weight: 600;}
        input[type=text], select{padding:4px 6px; border: 1px solid #ddd; border-radius: 3px;}
        input[type=text] {min-width: 200px;}
        button{padding:4px 8px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 3px;}
        button:hover {background: #f0f0f0;}
        .content {flex: 1; overflow: auto; padding: 8px;}
        table{width:100%; border-collapse: collapse;}
        th,td{ padding:6px 8px; border-bottom:1px solid #eee; text-align:left; font-size: 11px; }
        th{ position:sticky; top:0; background:#f8f8f8; font-weight: 600; z-index: 1; }
        .muted{ color:#888 }
        .retained { background: #fffbf0; }
        .action-btn {padding: 2px 6px; font-size: 10px; margin-left: 4px;}
        .state-tree {font-family: ui-monospace, monospace;}
        .tree-node {padding: 4px 0;}
        .tree-topic {font-weight: 600; color: #0066cc; cursor: pointer;}
        .tree-topic:hover {text-decoration: underline;}
        .tree-data {margin-left: 20px; color: #666;}
        .tree-toggle {cursor: pointer; user-select: none; display: inline-block; width: 12px;}
        tr.expanded .tree-data {display: table-row;}
        tr:not(.expanded) .tree-data {display: none;}
        .metrics-grid {display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;}
        .metric-card {background: white; border: 1px solid #ddd; border-radius: 4px; padding: 12px;}
        .metric-value {font-size: 24px; font-weight: 600; color: #007bff;}
        .metric-label {font-size: 11px; color: #666; text-transform: uppercase; margin-top: 4px;}
        .metric-list {margin-top: 8px; max-height: 200px; overflow: auto;}
        .metric-list-item {display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f0f0f0;}
        #detailsModal {position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                       background: white; border: 1px solid #ddd; border-radius: 4px;
                       padding: 16px; max-width: 600px; max-height: 80vh; overflow: auto;
                       box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; display: none;}
        #detailsModal.show {display: block;}
        #detailsOverlay {position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                         background: rgba(0,0,0,0.3); z-index: 999; display: none;}
        #detailsOverlay.show {display: block;}
        .details-header {display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;}
        .details-title {font-weight: 600; font-size: 14px;}
        pre {background: #f5f5f5; padding: 8px; border-radius: 3px; overflow: auto; max-height: 400px;}
      </style>
      <header>
        <div class="tabs">
          <button class="tab-btn ${this.viewMode==="messages"?"active":""}" data-mode="messages">Messages</button>
          <button class="tab-btn ${this.viewMode==="state"?"active":""}" data-mode="state">State Tree</button>
          <button class="tab-btn ${this.viewMode==="metrics"?"active":""}" data-mode="metrics">Metrics</button>
        </div>
        ${this.viewMode==="messages"?e`
          <input id="filter" type="text" placeholder="Filter by topic…" value="${this.filter}" />
          <select id="messageTypeFilter">
            <option value="all" ${this.messageTypeFilter==="all"?"selected":""}>All</option>
            <option value="retained" ${this.messageTypeFilter==="retained"?"selected":""}>Retained</option>
            <option value="transient" ${this.messageTypeFilter==="transient"?"selected":""}>Transient</option>
          </select>
        `:""}
        ${this.viewMode==="state"?e`
          <input id="filter" type="text" placeholder="Filter topics…" value="${this.filter}" />
          <button id="export">Export</button>
          <button id="import">Import</button>
          <button id="clearState">Clear</button>
        `:""}
        <button id="pause">${this.paused?"Resume":"Pause"}</button>
        <button id="clear">Clear</button>
      </header>
      <div class="content" id="content"></div>
      <div id="detailsOverlay"></div>
      <div id="detailsModal">
        <div class="details-header">
          <div class="details-title">Message Details</div>
          <button id="closeDetails">Close</button>
        </div>
        <div id="detailsContent"></div>
      </div>
    `,this.viewMode==="messages"?this.renderRows():this.viewMode==="state"?this.renderStateTree():this.viewMode==="metrics"&&this.renderMetrics()}renderControls(){const e=this.shadowRoot.getElementById("pause");e&&(e.textContent=this.paused?"Resume":"Pause")}renderRows(){const e=this.shadowRoot.getElementById("content");if(!e)return;const t=(this.filter||"").toLowerCase();let i=this.events.filter(s=>!t||s.topic.toLowerCase().includes(t));this.messageTypeFilter==="retained"?i=i.filter(s=>s.retained):this.messageTypeFilter==="transient"&&(i=i.filter(s=>!s.retained)),e.innerHTML=`
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Topic</th>
            <th>Type</th>
            <th>Size</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${i.slice(-500).map((s,a)=>`
            <tr class="${s.retained?"retained":""}">
              <td class="muted">${new Date(s.ts).toLocaleTimeString()}</td>
              <td>${s.topic}</td>
              <td class="muted">${s.retained?"Retained":"Transient"}</td>
              <td class="muted">${this._formatBytes(s.size)}</td>
              <td class="muted">${s.duration?s.duration.toFixed(2)+"ms":"-"}</td>
              <td>
                <button class="action-btn replay" data-i="${a}">Replay</button>
                <button class="action-btn inspect-msg" data-i="${a}">Inspect</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `}renderStateTree(){const e=this.shadowRoot.getElementById("content");if(!e)return;const t=(this.filter||"").toLowerCase(),i=Array.from(this.retainedMessages.entries()).filter(([s])=>!t||s.toLowerCase().includes(t)).sort(([s],[a])=>s.localeCompare(a));if(i.length===0){e.innerHTML='<div style="padding: 20px; text-align: center; color: #999;">No retained state available</div>';return}e.innerHTML=`
      <table class="state-tree">
        <thead>
          <tr>
            <th>Topic</th>
            <th>Size</th>
            <th>Last Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${i.map(([s,a])=>`
            <tr class="tree-node">
              <td>
                <span class="tree-toggle">▶</span>
                <span class="tree-topic">${s}</span>
              </td>
              <td class="muted">${this._formatBytes(a.size)}</td>
              <td class="muted">${new Date(a.ts).toLocaleTimeString()}</td>
              <td>
                <button class="action-btn inspect-state" data-topic="${s}">Inspect</button>
              </td>
            </tr>
            <tr class="tree-data">
              <td colspan="4">
                <pre>${JSON.stringify(a.msg.data,null,2)}</pre>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `,e.querySelectorAll(".tree-toggle, .tree-topic").forEach(s=>{s.addEventListener("click",a=>{const o=a.target.closest("tr");if(o){o.classList.toggle("expanded");const n=o.querySelector(".tree-toggle");n&&(n.textContent=o.classList.contains("expanded")?"▼":"▶")}})})}renderMetrics(){const e=this.shadowRoot.getElementById("content");if(!e)return;const t=Array.from(this.stats.messagesByTopic.entries()).sort((s,a)=>a[1]-s[1]).slice(0,10),i=this.stats.totalMessages/((Date.now()-(this.events[0]?.ts||Date.now()))/1e3);e.innerHTML=`
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">${this.stats.totalMessages}</div>
          <div class="metric-label">Total Messages</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${this.retainedMessages.size}</div>
          <div class="metric-label">Retained Messages</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${this._formatBytes(this.stats.averageSize)}</div>
          <div class="metric-label">Avg Message Size</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${i.toFixed(1)}/s</div>
          <div class="metric-label">Message Rate</div>
        </div>
        <div class="metric-card">
          <div class="metric-label" style="margin-bottom: 8px;">Top Topics by Volume</div>
          <div class="metric-list">
            ${t.map(([s,a])=>`
              <div class="metric-list-item">
                <span>${s}</span>
                <span>${a}</span>
              </div>
            `).join("")}
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${this.stats.messagesByTopic.size}</div>
          <div class="metric-label">Unique Topics</div>
        </div>
      </div>
    `}_showMessageDetails(e){const t=this.shadowRoot.getElementById("detailsModal"),i=this.shadowRoot.getElementById("detailsOverlay"),s=this.shadowRoot.getElementById("detailsContent");!t||!i||!s||(s.innerHTML=`
      <div style="margin-bottom: 12px;">
        <strong>Topic:</strong> ${e.topic}
      </div>
      <div style="margin-bottom: 12px;">
        <strong>Timestamp:</strong> ${new Date(e.ts).toLocaleString()}
      </div>
      <div style="margin-bottom: 12px;">
        <strong>Size:</strong> ${this._formatBytes(e.size)}
      </div>
      <div style="margin-bottom: 12px;">
        <strong>Type:</strong> ${e.retained?"Retained":"Transient"}
      </div>
      ${e.duration?`<div style="margin-bottom: 12px;"><strong>Duration:</strong> ${e.duration.toFixed(2)}ms</div>`:""}
      <div style="margin-bottom: 8px;">
        <strong>Data:</strong>
      </div>
      <pre>${JSON.stringify(e.msg.data,null,2)}</pre>
      ${e.msg.meta?`
        <div style="margin-top: 12px; margin-bottom: 8px;">
          <strong>Metadata:</strong>
        </div>
        <pre>${JSON.stringify(e.msg.meta,null,2)}</pre>
      `:""}
    `,t.classList.add("show"),i.classList.add("show"),i.onclick=()=>this._hideMessageDetails())}_hideMessageDetails(){const e=this.shadowRoot.getElementById("detailsModal"),t=this.shadowRoot.getElementById("detailsOverlay");e&&e.classList.remove("show"),t&&t.classList.remove("show")}_exportState(){const e={};for(const[a,o]of this.retainedMessages.entries())e[a]=o.msg.data;const t=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),i=URL.createObjectURL(t),s=document.createElement("a");s.href=i,s.download=`pan-state-${Date.now()}.json`,s.click(),URL.revokeObjectURL(i)}_importState(){const e=document.createElement("input");e.type="file",e.accept="application/json",e.onchange=t=>{const i=t.target.files[0];if(!i)return;const s=new FileReader;s.onload=a=>{try{const o=JSON.parse(a.target.result);for(const[n,d]of Object.entries(o))this.pc.publish(n,d,{retain:!0});alert(`Imported ${Object.keys(o).length} state entries`)}catch(o){alert("Failed to import state: "+o.message)}},s.readAsText(i)},e.click()}_formatBytes(e){if(e===0)return"0 B";const t=1024,i=["B","KB","MB"],s=Math.floor(Math.log(e)/Math.log(t));return parseFloat((e/Math.pow(t,s)).toFixed(1))+" "+i[s]}}customElements.define("pan-inspector",r);var h=r;export{r as PanInspector,h as default};

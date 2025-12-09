import{PanClient as h}from"../../../core/src/components/pan-client.mjs";class n extends HTMLElement{static get observedAttributes(){return["type","data","options","topic","library","width","height"]}constructor(){super(),this.attachShadow({mode:"open"}),this.pc=new h(this),this.chart=null}connectedCallback(){this.render(),this.setupTopics(),this.initChart()}disconnectedCallback(){this.chart&&this.chart.destroy&&this.chart.destroy()}attributeChangedCallback(t,a,i){this.isConnected&&(t==="data"||t==="options"||t==="type"?this.updateChart():this.render())}get type(){return this.getAttribute("type")||"line"}get data(){const t=this.getAttribute("data");if(!t)return this.getDefaultData();try{return JSON.parse(t)}catch(a){return console.error("Invalid data JSON:",a),this.getDefaultData()}}get options(){const t=this.getAttribute("options");if(!t)return this.getDefaultOptions();try{return JSON.parse(t)}catch(a){return console.error("Invalid options JSON:",a),this.getDefaultOptions()}}get topic(){return this.getAttribute("topic")||"chart"}get library(){return this.getAttribute("library")||"chart-js"}get width(){return this.getAttribute("width")||"100%"}get height(){return this.getAttribute("height")||"300px"}getDefaultData(){return{labels:["Jan","Feb","Mar","Apr","May","Jun"],datasets:[{label:"Sample Data",data:[12,19,3,5,2,3],borderColor:"#6366f1",backgroundColor:"rgba(99, 102, 241, 0.1)",tension:.4}]}}getDefaultOptions(){return{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!0,position:"top"}},onClick:(t,a)=>{if(a.length>0){const i=a[0],e=i.datasetIndex,s=i.index,r=this.chart.data.datasets[e].data[s];this.pc.publish({topic:`${this.topic}.click`,data:{dataPoint:r,datasetIndex:e,index:s}})}},onHover:(t,a)=>{if(a.length>0){const i=a[0],e=i.datasetIndex,s=i.index,r=this.chart.data.datasets[e].data[s];this.pc.publish({topic:`${this.topic}.hover`,data:{dataPoint:r,datasetIndex:e,index:s}})}}}}setupTopics(){this.pc.subscribe(`${this.topic}.update`,t=>{t.data.data&&this.setAttribute("data",JSON.stringify(t.data.data)),t.data.options&&this.setAttribute("options",JSON.stringify(t.data.options))}),this.pc.subscribe(`${this.topic}.addData`,t=>{this.chart&&t.data.label&&t.data.data&&(this.chart.data.labels.push(t.data.label),this.chart.data.datasets.forEach((a,i)=>{const e=Array.isArray(t.data.data)?t.data.data[i]:t.data.data;a.data.push(e)}),this.chart.update())}),this.pc.subscribe(`${this.topic}.removeData`,t=>{this.chart&&typeof t.data.index=="number"&&(this.chart.data.labels.splice(t.data.index,1),this.chart.data.datasets.forEach(a=>{a.data.splice(t.data.index,1)}),this.chart.update())})}async initChart(){const t=this.shadowRoot.querySelector("canvas");if(t)if(this.library==="chart-js"){if(typeof Chart>"u"){console.error('Chart.js is not loaded. Please include: <script src="https://cdn.jsdelivr.net/npm/chart.js"><\/script>'),t.parentElement.innerHTML=`
          <div style="padding: 2rem; text-align: center; color: #ef4444;">
            <strong>Chart.js not loaded</strong><br>
            <small>Include Chart.js: &lt;script src="https://cdn.jsdelivr.net/npm/chart.js"&gt;&lt;/script&gt;</small>
          </div>
        `;return}const a=t.getContext("2d"),i={type:this.type,data:this.data,options:this.options};this.chart=new Chart(a,i),this.pc.publish({topic:`${this.topic}.ready`,data:{chart:this.chart}})}else this.library==="custom"&&this.dispatchEvent(new CustomEvent("custom-render",{detail:{canvas:t,data:this.data,options:this.options,type:this.type}}))}updateChart(){if(!this.chart){this.initChart();return}this.library==="chart-js"?(this.chart.data=this.data,this.chart.options=this.options,this.chart.update()):this.library==="custom"&&this.dispatchEvent(new CustomEvent("custom-update",{detail:{data:this.data,options:this.options}}))}render(){this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: block;
          width: ${this.width};
          height: ${this.height};
        }

        .chart-container {
          width: 100%;
          height: 100%;
          position: relative;
          background: var(--chart-bg, #ffffff);
          border-radius: var(--chart-radius, 0.5rem);
          padding: var(--chart-padding, 1rem);
          box-sizing: border-box;
        }

        .chart-wrapper {
          width: 100%;
          height: 100%;
          position: relative;
        }

        canvas {
          max-width: 100%;
          max-height: 100%;
        }

        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--chart-loading-color, #94a3b8);
          font-size: 0.875rem;
        }
      </style>

      <div class="chart-container">
        <div class="chart-wrapper">
          <canvas></canvas>
        </div>
      </div>
    `,this.isConnected&&setTimeout(()=>this.initChart(),0)}}customElements.define("pan-chart",n);var c=n;export{n as PanChart,c as default};

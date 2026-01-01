import{PanClient as p}from"../core/pan-client.mjs";const l="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",u="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";class d extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.pc=new p(this),this._off=null,this._map=null,this._markersLayer=null,this._items=[],this._leafletLoaded=!1}static get observedAttributes(){return["resource","lat-field","lng-field","label-field","detail-fields","size-field","size-min","size-max","color","center-lat","center-lng","zoom","height"]}get resource(){return this.getAttribute("resource")||"items"}get latField(){return this.getAttribute("lat-field")||"lat"}get lngField(){return this.getAttribute("lng-field")||"lng"}get labelField(){return this.getAttribute("label-field")||"name"}get detailFields(){const t=this.getAttribute("detail-fields");return t?t.split(",").map(i=>i.trim()):[]}get sizeField(){return this.getAttribute("size-field")||""}get sizeMin(){return parseFloat(this.getAttribute("size-min"))||5}get sizeMax(){return parseFloat(this.getAttribute("size-max"))||25}get color(){return this.getAttribute("color")||"#e74c3c"}get centerLat(){return parseFloat(this.getAttribute("center-lat"))||20}get centerLng(){return parseFloat(this.getAttribute("center-lng"))||0}get zoom(){return parseInt(this.getAttribute("zoom"))||2}get height(){return this.getAttribute("height")||"400px"}async connectedCallback(){this._render(),await this._loadLeaflet(),this._initMap(),this._subscribe()}disconnectedCallback(){this._off?.(),this._off=null,this._map&&(this._map.remove(),this._map=null)}attributeChangedCallback(t,i,s){if(!(!this.isConnected||i===s))if(t==="resource")this._subscribe();else if(t==="height"){const e=this.shadowRoot.getElementById("map");e&&(e.style.height=this.height),this._map?.invalidateSize()}else["center-lat","center-lng","zoom"].includes(t)?this._map?.setView([this.centerLat,this.centerLng],this.zoom):this._updateMarkers()}_render(){this.shadowRoot.innerHTML=`
      <link rel="stylesheet" href="${l}">
      <style>
        :host {
          display: block;
          width: 100%;
        }
        .map-container {
          width: 100%;
          height: ${this.height};
          border-radius: 8px;
          overflow: hidden;
          background: #e0e0e0;
        }
        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #666;
          font-family: system-ui, sans-serif;
        }
        .map-stats {
          display: flex;
          gap: 16px;
          padding: 8px 0;
          font-size: 12px;
          color: #666;
          font-family: system-ui, sans-serif;
        }
        .stat-value {
          font-weight: 600;
          color: #333;
        }
      </style>
      <div id="map" class="map-container">
        <div class="loading">Loading map...</div>
      </div>
      <div class="map-stats">
        <span>Markers: <span class="stat-value" id="marker-count">0</span></span>
        <span>Bounds: <span class="stat-value" id="bounds-info">-</span></span>
      </div>
    `}async _loadLeaflet(){if(window.L){this._leafletLoaded=!0;return}if(!document.querySelector(`link[href="${l}"]`)){const t=document.createElement("link");t.rel="stylesheet",t.href=l,document.head.appendChild(t)}document.querySelector(`script[src="${u}"]`)||await new Promise((t,i)=>{const s=document.createElement("script");s.src=u,s.onload=t,s.onerror=i,document.head.appendChild(s)}),this._leafletLoaded=!0}_initMap(){if(!this._leafletLoaded||!window.L)return;const t=this.shadowRoot.getElementById("map");t.innerHTML="",this._map=L.map(t,{center:[this.centerLat,this.centerLng],zoom:this.zoom,scrollWheelZoom:!0}),L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',maxZoom:19}).addTo(this._map),this._markersLayer=L.layerGroup().addTo(this._map),this._items.length>0&&this._updateMarkers()}_subscribe(){this._off?.(),this._off=this.pc.subscribe(`${this.resource}.list.state`,t=>this._onData(t.data),{retained:!0})}_onData(t){this._items=t?.items||[],this._updateMarkers()}_updateMarkers(){if(!this._map||!this._markersLayer)return;this._markersLayer.clearLayers();let t={min:0,max:1};if(this.sizeField&&this._items.length>0){const e=this._items.map(n=>this._getNumericValue(n,this.sizeField)).filter(n=>n!==null);e.length>0&&(t.min=Math.min(...e),t.max=Math.max(...e))}const i=[];let s=0;for(const e of this._items){const n=this._getNumericValue(e,this.latField),a=this._getNumericValue(e,this.lngField);if(n===null||a===null)continue;let r=this.sizeMin;if(this.sizeField){const h=this._getNumericValue(e,this.sizeField);if(h!==null&&t.max>t.min){const m=(h-t.min)/(t.max-t.min);r=this.sizeMin+m*(this.sizeMax-this.sizeMin)}}const o=L.circleMarker([n,a],{radius:r,fillColor:this.color,color:"#fff",weight:1,opacity:1,fillOpacity:.7}),c=this._createPopup(e);o.bindPopup(c),o.addTo(this._markersLayer),i.push([n,a]),s++}if(this.shadowRoot.getElementById("marker-count").textContent=s,i.length>0){const e=L.latLngBounds(i);this.shadowRoot.getElementById("bounds-info").textContent=`${e.getSouthWest().lat.toFixed(1)}°, ${e.getSouthWest().lng.toFixed(1)}° to ${e.getNorthEast().lat.toFixed(1)}°, ${e.getNorthEast().lng.toFixed(1)}°`,i.length>1&&this._map.fitBounds(e,{padding:[20,20],maxZoom:8})}else this.shadowRoot.getElementById("bounds-info").textContent="No data"}_getNumericValue(t,i){if(!i)return null;const s=i.split(".");let e=t;for(const n of s){if(e==null)return null;e=e[n]}if(typeof e=="string"){const n=parseFloat(e);return isNaN(n)?null:n}return typeof e=="number"?e:null}_getValue(t,i){if(!i)return null;const s=i.split(".");let e=t;for(const n of s){if(e==null)return null;e=e[n]}return e}_createPopup(t){const i=this._getValue(t,this.labelField)||"Unknown";let s=`<div style="font-family: system-ui, sans-serif;">
      <strong style="font-size: 14px;">${this._escapeHtml(String(i))}</strong>`;if(this.detailFields.length>0){s+='<div style="margin-top: 8px; font-size: 12px; color: #666;">';for(const e of this.detailFields){const n=this._getValue(t,e);n!=null&&(s+=`<div><strong>${this._escapeHtml(e)}:</strong> ${this._escapeHtml(String(n))}</div>`)}s+="</div>"}return s+="</div>",s}_escapeHtml(t){const i=document.createElement("div");return i.textContent=t,i.innerHTML}fitBounds(){if(!this._map||!this._items.length)return;const t=this._items.map(i=>{const s=this._getNumericValue(i,this.latField),e=this._getNumericValue(i,this.lngField);return s!==null&&e!==null?[s,e]:null}).filter(Boolean);t.length>0&&this._map.fitBounds(L.latLngBounds(t),{padding:[20,20]})}getMap(){return this._map}getMarkersLayer(){return this._markersLayer}}customElements.define("pan-leaflet-map",d);var _=d;export{d as PanLeafletMap,_ as default};

/**
 * <pan-leaflet-map> - Interactive map component using Leaflet.js
 *
 * Displays geographic data from PAN data sources on an OpenStreetMap base layer.
 * Automatically subscribes to resource list state and plots markers.
 *
 * Attributes:
 * - resource: PAN resource name to subscribe to (e.g., "earthquakes")
 * - lat-field: field name containing latitude (default: "lat")
 * - lng-field: field name containing longitude (default: "lng")
 * - label-field: field for marker popup title (default: "name")
 * - detail-fields: comma-separated fields for popup details (optional)
 * - size-field: field for marker size scaling (optional, e.g., "mag" for earthquakes)
 * - size-min: minimum marker radius in pixels (default: 5)
 * - size-max: maximum marker radius in pixels (default: 25)
 * - color: marker color (default: "#e74c3c")
 * - center-lat: initial map center latitude (default: 20)
 * - center-lng: initial map center longitude (default: 0)
 * - zoom: initial zoom level (default: 2)
 * - height: map height (default: "400px")
 *
 * Topics Subscribed:
 * - `${resource}.list.state`: Updates markers when data changes
 *
 * Example:
 * <pan-leaflet-map
 *   resource="earthquakes"
 *   lat-field="lat"
 *   lng-field="lng"
 *   label-field="place"
 *   detail-fields="mag,time,depth"
 *   size-field="mag"
 *   color="#e74c3c"
 *   height="500px">
 * </pan-leaflet-map>
 */

import { PanClient } from '../core/pan-client.mjs';

// Leaflet CSS and JS URLs
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

export class PanLeafletMap extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.pc = new PanClient(this);
    this._off = null;
    this._map = null;
    this._markersLayer = null;
    this._items = [];
    this._leafletLoaded = false;
  }

  static get observedAttributes() {
    return [
      'resource', 'lat-field', 'lng-field', 'label-field', 'detail-fields',
      'size-field', 'size-min', 'size-max', 'color',
      'center-lat', 'center-lng', 'zoom', 'height'
    ];
  }

  // Attribute getters
  get resource() { return this.getAttribute('resource') || 'items'; }
  get latField() { return this.getAttribute('lat-field') || 'lat'; }
  get lngField() { return this.getAttribute('lng-field') || 'lng'; }
  get labelField() { return this.getAttribute('label-field') || 'name'; }
  get detailFields() {
    const fields = this.getAttribute('detail-fields');
    return fields ? fields.split(',').map(f => f.trim()) : [];
  }
  get sizeField() { return this.getAttribute('size-field') || ''; }
  get sizeMin() { return parseFloat(this.getAttribute('size-min')) || 5; }
  get sizeMax() { return parseFloat(this.getAttribute('size-max')) || 25; }
  get color() { return this.getAttribute('color') || '#e74c3c'; }
  get centerLat() { return parseFloat(this.getAttribute('center-lat')) || 20; }
  get centerLng() { return parseFloat(this.getAttribute('center-lng')) || 0; }
  get zoom() { return parseInt(this.getAttribute('zoom')) || 2; }
  get height() { return this.getAttribute('height') || '400px'; }

  async connectedCallback() {
    this._render();
    await this._loadLeaflet();
    this._initMap();
    this._subscribe();
  }

  disconnectedCallback() {
    this._off?.();
    this._off = null;
    if (this._map) {
      this._map.remove();
      this._map = null;
    }
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!this.isConnected || oldVal === newVal) return;

    if (name === 'resource') {
      this._subscribe();
    } else if (name === 'height') {
      const container = this.shadowRoot.getElementById('map');
      if (container) container.style.height = this.height;
      this._map?.invalidateSize();
    } else if (['center-lat', 'center-lng', 'zoom'].includes(name)) {
      this._map?.setView([this.centerLat, this.centerLng], this.zoom);
    } else {
      // Re-render markers for other attribute changes
      this._updateMarkers();
    }
  }

  _render() {
    this.shadowRoot.innerHTML = `
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
    `;
  }

  async _loadLeaflet() {
    // Check if Leaflet is already loaded
    if (window.L) {
      this._leafletLoaded = true;
      return;
    }

    // Load CSS
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    // Load JS
    if (!document.querySelector(`script[src="${LEAFLET_JS}"]`)) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = LEAFLET_JS;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    this._leafletLoaded = true;
  }

  _initMap() {
    if (!this._leafletLoaded || !window.L) return;

    const container = this.shadowRoot.getElementById('map');
    container.innerHTML = ''; // Clear loading message

    // Create map
    this._map = L.map(container, {
      center: [this.centerLat, this.centerLng],
      zoom: this.zoom,
      scrollWheelZoom: true
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this._map);

    // Create markers layer
    this._markersLayer = L.layerGroup().addTo(this._map);

    // Initial marker render if we have data
    if (this._items.length > 0) {
      this._updateMarkers();
    }
  }

  _subscribe() {
    this._off?.();
    this._off = this.pc.subscribe(
      `${this.resource}.list.state`,
      (m) => this._onData(m.data),
      { retained: true }
    );
  }

  _onData(data) {
    this._items = data?.items || [];
    this._updateMarkers();
  }

  _updateMarkers() {
    if (!this._map || !this._markersLayer) return;

    // Clear existing markers
    this._markersLayer.clearLayers();

    // Calculate size range if using size field
    let sizeRange = { min: 0, max: 1 };
    if (this.sizeField && this._items.length > 0) {
      const values = this._items
        .map(item => this._getNumericValue(item, this.sizeField))
        .filter(v => v !== null);
      if (values.length > 0) {
        sizeRange.min = Math.min(...values);
        sizeRange.max = Math.max(...values);
      }
    }

    // Add markers
    const bounds = [];
    let markerCount = 0;

    for (const item of this._items) {
      const lat = this._getNumericValue(item, this.latField);
      const lng = this._getNumericValue(item, this.lngField);

      if (lat === null || lng === null) continue;

      // Calculate marker size
      let radius = this.sizeMin;
      if (this.sizeField) {
        const sizeValue = this._getNumericValue(item, this.sizeField);
        if (sizeValue !== null && sizeRange.max > sizeRange.min) {
          const normalized = (sizeValue - sizeRange.min) / (sizeRange.max - sizeRange.min);
          radius = this.sizeMin + (normalized * (this.sizeMax - this.sizeMin));
        }
      }

      // Create circle marker
      const marker = L.circleMarker([lat, lng], {
        radius: radius,
        fillColor: this.color,
        color: '#fff',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7
      });

      // Create popup content
      const popup = this._createPopup(item);
      marker.bindPopup(popup);

      marker.addTo(this._markersLayer);
      bounds.push([lat, lng]);
      markerCount++;
    }

    // Update stats
    this.shadowRoot.getElementById('marker-count').textContent = markerCount;

    // Fit bounds if we have markers
    if (bounds.length > 0) {
      const latLngBounds = L.latLngBounds(bounds);
      this.shadowRoot.getElementById('bounds-info').textContent =
        `${latLngBounds.getSouthWest().lat.toFixed(1)}°, ${latLngBounds.getSouthWest().lng.toFixed(1)}° to ${latLngBounds.getNorthEast().lat.toFixed(1)}°, ${latLngBounds.getNorthEast().lng.toFixed(1)}°`;

      // Only auto-fit if this is initial load or significant change
      if (bounds.length > 1) {
        this._map.fitBounds(latLngBounds, { padding: [20, 20], maxZoom: 8 });
      }
    } else {
      this.shadowRoot.getElementById('bounds-info').textContent = 'No data';
    }
  }

  _getNumericValue(item, field) {
    if (!field) return null;

    // Support dot notation for nested fields
    const parts = field.split('.');
    let value = item;
    for (const part of parts) {
      if (value == null) return null;
      value = value[part];
    }

    // Handle string numbers (e.g., "4.5")
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    }

    return typeof value === 'number' ? value : null;
  }

  _getValue(item, field) {
    if (!field) return null;

    const parts = field.split('.');
    let value = item;
    for (const part of parts) {
      if (value == null) return null;
      value = value[part];
    }
    return value;
  }

  _createPopup(item) {
    const label = this._getValue(item, this.labelField) || 'Unknown';

    let html = `<div style="font-family: system-ui, sans-serif;">
      <strong style="font-size: 14px;">${this._escapeHtml(String(label))}</strong>`;

    if (this.detailFields.length > 0) {
      html += '<div style="margin-top: 8px; font-size: 12px; color: #666;">';
      for (const field of this.detailFields) {
        const value = this._getValue(item, field);
        if (value != null) {
          html += `<div><strong>${this._escapeHtml(field)}:</strong> ${this._escapeHtml(String(value))}</div>`;
        }
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Public API

  /**
   * Fit map to show all markers
   */
  fitBounds() {
    if (!this._map || !this._items.length) return;

    const bounds = this._items
      .map(item => {
        const lat = this._getNumericValue(item, this.latField);
        const lng = this._getNumericValue(item, this.lngField);
        return lat !== null && lng !== null ? [lat, lng] : null;
      })
      .filter(Boolean);

    if (bounds.length > 0) {
      this._map.fitBounds(L.latLngBounds(bounds), { padding: [20, 20] });
    }
  }

  /**
   * Get the Leaflet map instance for advanced customization
   */
  getMap() {
    return this._map;
  }

  /**
   * Get the markers layer group
   */
  getMarkersLayer() {
    return this._markersLayer;
  }
}

customElements.define('pan-leaflet-map', PanLeafletMap);
export default PanLeafletMap;

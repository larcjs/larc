/**
 * feature-tables
 *
 * Table feature module.
 * Provides table insertion.
 *
 * PAN Events:
 * - features.register: Registers buttons with toolbar
 * - features.action: Responds to table actions
 */

class FeatureTables {
  constructor() {
    this.group = 'tables';
    this.enabled = false;
    this._init();
  }

  _init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this._register());
    } else {
      setTimeout(() => this._register(), 100);
    }
  }

  _register() {
    const bus = document.querySelector('pan-bus');
    if (!bus) {
      console.warn('feature-tables: pan-bus not found, retrying...');
      setTimeout(() => this._register(), 200);
      return;
    }

    // Register with toolbar
    bus.publish('features.register', {
      group: this.group,
      buttons: [
        { action: 'table', icon: '&#8862;', title: 'Insert Table' }
      ]
    });

    // Notify that feature is available
    bus.publish('features.available', {
      group: this.group,
      name: 'Tables',
      description: 'Markdown tables'
    });

    console.log('feature-tables: registered');
  }
}

// Auto-initialize
const featureTables = new FeatureTables();

export default featureTables;

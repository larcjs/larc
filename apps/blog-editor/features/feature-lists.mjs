/**
 * feature-lists
 *
 * List formatting feature module.
 * Provides bullet lists, numbered lists, and task lists.
 *
 * PAN Events:
 * - features.register: Registers buttons with toolbar
 * - features.action: Responds to list actions
 */

class FeatureLists {
  constructor() {
    this.group = 'lists';
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
      console.warn('feature-lists: pan-bus not found, retrying...');
      setTimeout(() => this._register(), 200);
      return;
    }

    // Register with toolbar
    bus.publish('features.register', {
      group: this.group,
      buttons: [
        { action: 'ul', icon: '&#8226;', title: 'Bullet List' },
        { action: 'ol', icon: '1.', title: 'Numbered List' },
        { action: 'task', icon: '&#9744;', title: 'Task List' }
      ]
    });

    // Notify that feature is available for loading
    bus.publish('features.available', {
      group: this.group,
      name: 'Lists',
      description: 'Bullet, numbered, and task lists'
    });

    console.log('feature-lists: registered');
  }
}

// Auto-initialize
const featureLists = new FeatureLists();

export default featureLists;

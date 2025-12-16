/**
 * feature-media
 *
 * Media feature module.
 * Provides links and images.
 *
 * PAN Events:
 * - features.register: Registers buttons with toolbar
 * - features.action: Responds to media actions
 */

class FeatureMedia {
  constructor() {
    this.group = 'media';
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
      console.warn('feature-media: pan-bus not found, retrying...');
      setTimeout(() => this._register(), 200);
      return;
    }

    // Register with toolbar
    bus.publish('features.register', {
      group: this.group,
      buttons: [
        { action: 'link', icon: '&#128279;', title: 'Insert Link (Ctrl+K)' },
        { action: 'image', icon: '&#128247;', title: 'Insert Image' }
      ]
    });

    // Notify that feature is available
    bus.publish('features.available', {
      group: this.group,
      name: 'Media',
      description: 'Links and images'
    });

    console.log('feature-media: registered');
  }
}

// Auto-initialize
const featureMedia = new FeatureMedia();

export default featureMedia;

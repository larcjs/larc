/**
 * feature-code
 *
 * Code feature module.
 * Provides inline code and code blocks.
 *
 * PAN Events:
 * - features.register: Registers buttons with toolbar
 * - features.action: Responds to code actions
 */

class FeatureCode {
  constructor() {
    this.group = 'code';
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
      console.warn('feature-code: pan-bus not found, retrying...');
      setTimeout(() => this._register(), 200);
      return;
    }

    // Register with toolbar
    bus.publish('features.register', {
      group: this.group,
      buttons: [
        { action: 'code', icon: '&lt;&gt;', title: 'Inline Code' },
        { action: 'codeblock', icon: '{ }', title: 'Code Block' },
        { action: 'quote', icon: '&#10077;', title: 'Blockquote' },
        { action: 'hr', icon: '&#8212;', title: 'Horizontal Rule' }
      ]
    });

    // Notify that feature is available
    bus.publish('features.available', {
      group: this.group,
      name: 'Code',
      description: 'Inline code, code blocks, quotes, and rules'
    });

    console.log('feature-code: registered');
  }
}

// Auto-initialize
const featureCode = new FeatureCode();

export default featureCode;

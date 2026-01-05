/**
 * feature-formatting
 *
 * Basic text formatting feature module.
 * Provides bold, italic, strikethrough, and heading formatting.
 *
 * This feature is always enabled by default.
 *
 * PAN Events:
 * - features.register: Registers buttons with toolbar
 * - features.action: Responds to formatting actions
 */

class FeatureFormatting {
  constructor() {
    this.group = 'formatting';
    this.enabled = true;
    this._init();
  }

  _init() {
    // Wait for DOM and PAN bus
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this._register());
    } else {
      // Small delay to ensure pan-bus is available
      setTimeout(() => this._register(), 100);
    }
  }

  _register() {
    const bus = document.querySelector('pan-bus');
    if (!bus) {
      console.warn('feature-formatting: pan-bus not found, retrying...');
      setTimeout(() => this._register(), 200);
      return;
    }

    // Register with toolbar
    bus.publish('features.register', {
      group: this.group,
      buttons: [
        { action: 'bold', icon: '<strong>B</strong>', title: 'Bold (Ctrl+B)' },
        { action: 'italic', icon: '<em>I</em>', title: 'Italic (Ctrl+I)' },
        { action: 'strikethrough', icon: '<del>S</del>', title: 'Strikethrough' },
        { action: 'h1', icon: 'H1', title: 'Heading 1' },
        { action: 'h2', icon: 'H2', title: 'Heading 2' },
        { action: 'h3', icon: 'H3', title: 'Heading 3' }
      ]
    });

    console.log('feature-formatting: registered');
  }
}

// Auto-initialize
const featureFormatting = new FeatureFormatting();

export default featureFormatting;

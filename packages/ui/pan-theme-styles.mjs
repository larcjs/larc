/**
 * PAN Theme Styles
 *
 * Provides a consistent set of CSS custom properties that work with pan-theme-provider.
 * Import this in your component's shadow DOM styles for automatic dark mode support.
 *
 * Usage:
 *   import { themeStyles } from '../packages/ui/pan-theme-styles.mjs';
 *
 *   render() {
 *     this.shadowRoot.innerHTML = `
 *       <style>
 *         ${themeStyles}
 *         /* your component styles here */
 *       </style>
 *     `;
 *   }
 */

export const themeStyles = `
  :host {
    /* CSS variables inherit from document root, so these will automatically
       update when pan-theme-provider changes the [data-theme] attribute */
    --color-bg: var(--color-bg, #f6f7fb);
    --color-surface: var(--color-surface, #ffffff);
    --color-surface-alt: var(--color-surface-alt, #f8f8f8);
    --color-border: var(--color-border, #e0e5f0);
    --color-border-strong: var(--color-border-strong, #c6cede);
    --color-text: var(--color-text, #0f172a);
    --color-muted: var(--color-muted, #5f6b84);
    --color-accent: var(--color-accent, #2563eb);
    --color-accent-soft: var(--color-accent-soft, #e0e7ff);
    --color-warning-light: var(--color-warning-light, #fffbf0);
    --color-inspector-bg: var(--color-inspector-bg, #101828);
    --color-code-bg: var(--color-code-bg, #f5f5f5);
  }
`;

export default themeStyles;

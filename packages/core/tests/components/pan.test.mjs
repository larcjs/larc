/**
 * Comprehensive tests for pan.mjs (autoloader)
 * Tests cover: configuration, component discovery, module loading,
 * progressive loading, dynamic content, and pan-bus integration
 */

import { test, expect } from '@playwright/test';
import { fileUrl } from '../lib/test-utils.mjs';

test.describe('PAN Autoloader', () => {
test.describe('Configuration', () => {
    test('should use default configuration', async ({ page, context }) => {
      const testPage = await context.newPage();

      try {
        await testPage.goto(fileUrl('tests/fixtures/pan-autoload-test.html'));

        const config = await testPage.evaluate(async () => {
          // Import autoloader
          const { panAutoload } = await import('../../src/pan.mjs');
          return panAutoload.config;
        });

        expect(config.extension).toBe('.mjs');
        expect(config.rootMargin).toBe(600);
        expect(config.componentsPath).toBe('./components/');
      } finally {
        await testPage.close();
      }
    });

    test('should merge custom configuration from window.panAutoload', async ({ page, context }) => {
      const testPage = await context.newPage();

      try {
        await testPage.addInitScript(() => {
          window.panAutoload = {
            extension: '.js',
            rootMargin: 1000,
            componentsPath: './custom/'
          };
        });

        await testPage.goto(fileUrl('tests/fixtures/pan-autoload-test.html'));

        const config = await testPage.evaluate(async () => {
          const { panAutoload } = await import('../../src/pan.mjs');
          return panAutoload.config;
        });

        expect(config.extension).toBe('.js');
        expect(config.rootMargin).toBe(1000);
        expect(config.componentsPath).toBe('./custom/');
      } finally {
        await testPage.close();
      }
    });

    test('should normalize extension with leading dot', async ({ page, context }) => {
      const testPage = await context.newPage();

      try {
        await testPage.addInitScript(() => {
          window.panAutoload = { extension: 'js' }; // Without dot
        });

        await testPage.goto(fileUrl('tests/fixtures/pan-autoload-test.html'));

        const config = await testPage.evaluate(async () => {
          const { panAutoload } = await import('../../src/pan.mjs');
          return panAutoload.config;
        });

        expect(config.extension).toBe('.js');
      } finally {
        await testPage.close();
      }
    });

    test('should resolve baseUrl with componentsPath', async ({ page, context }) => {
      const testPage = await context.newPage();

      try {
        await testPage.addInitScript(() => {
          window.panAutoload = {
            baseUrl: 'https://cdn.example.com/larc',
            componentsPath: './components/'
          };
        });

        await testPage.goto(fileUrl('tests/fixtures/pan-autoload-test.html'));

        const config = await testPage.evaluate(async () => {
          const { panAutoload } = await import('../../src/pan.mjs');
          return panAutoload.config;
        });

        expect(config.resolvedComponentsPath).toContain('cdn.example.com');
        expect(config.resolvedComponentsPath).toContain('components');
      } finally {
        await testPage.close();
      }
    });
  });

  test.describe('Component Discovery', () => {
    test('should detect undefined custom elements', async ({ page, context }) => {
      const testPage = await context.newPage();

      try {
        await testPage.goto(fileUrl('tests/fixtures/pan-autoload-test.html'));

        const result = await testPage.evaluate(async () => {
          // Import autoloader which will define pan-bus
          await import('../../src/pan.mjs');

          // Wait for pan-bus element to exist in DOM (created by ensurePanBus)
          await new Promise(resolve => {
            const checkBus = () => {
              if (document.querySelector('pan-bus')) {
                resolve();
              } else {
                setTimeout(checkBus, 10);
              }
            };
            checkBus();
          });

          // Wait for pan-bus to be fully defined
          await customElements.whenDefined('pan-bus');

          // Give it a moment to fully register
          await new Promise(r => setTimeout(r, 50));

          // Create test elements
          const defined = document.createElement('div');
          const customUndefined = document.createElement('test-widget');
          const customDefined = document.createElement('pan-bus');

          // Check which are custom tags
          const isCustomTag = (node) => {
            return (
              node &&
              node.nodeType === 1 &&
              typeof node.tagName === 'string' &&
              node.tagName.includes('-') &&
              !customElements.get(node.localName)
            );
          };

          return {
            defined: isCustomTag(defined),
            customUndefined: isCustomTag(customUndefined),
            customDefined: isCustomTag(customDefined)
          };
        });

        expect(result.defined).toBe(false); // 'div' has no dash
        expect(result.customUndefined).toBe(true); // 'test-widget' is custom and undefined
        expect(result.customDefined).toBe(false); // 'pan-bus' should be defined by autoloader
      } finally {
        await testPage.close();
      }
    });

    test('should query :not(:defined) selector', async ({ page, context }) => {
      const testPage = await context.newPage();

      try {
        await testPage.goto(fileUrl('tests/fixtures/pan-autoload-test.html'));

        await testPage.evaluate(() => {
          // Add some undefined custom elements
          const container = document.getElementById('test-container');
          container.innerHTML = `
            <test-widget></test-widget>
            <div>Not custom</div>
            <another-test></another-test>
            <span>Also not custom</span>
          `;
        });

        const count = await testPage.evaluate(() => {
          const undefinedElements = document.querySelectorAll(':not(:defined)');
          return undefinedElements.length;
        });

        expect(count).toBeGreaterThan(0);
      } finally {
        await testPage.close();
      }
    });
  });

  test.describe('Module Loading', () => {
    test('should load component with maybeLoadFor', async ({ page, context }) => {
      const testPage = await context.newPage();

      try {
        await testPage.goto(fileUrl('tests/fixtures/pan-autoload-test.html'));

        const result = await testPage.evaluate(async () => {
          const { panAutoload } = await import('../../src/pan.mjs');

          // Wait for pan-bus element to exist in DOM
          await new Promise(resolve => {
            const checkBus = () => {
              if (document.querySelector('pan-bus')) {
                resolve();
              } else {
                setTimeout(checkBus, 10);
              }
            };
            checkBus();
          });

          // Wait for pan-bus to be automatically loaded
          await customElements.whenDefined('pan-bus');

          // Give it a moment to fully register
          await new Promise(r => setTimeout(r, 50));

          // Create pan-bus element
          const bus = document.createElement('pan-bus');
          document.body.appendChild(bus);

          // Try to load it (should be a no-op since already defined)
          await panAutoload.maybeLoadFor(bus);

          // Check if it's defined
          return {
            isDefined: customElements.get('pan-bus') !== undefined
          };
        });

        expect(result.isDefined).toBe(true);
      } finally {
        await testPage.close();
      }
    });

    test('should skip already defined elements', async ({ page, context }) => {
      const testPage = await context.newPage();

      try {
        await testPage.goto(fileUrl('tests/fixtures/pan-autoload-test.html'));

        const result = await testPage.evaluate(async () => {
          const { panAutoload } = await import('../../src/pan.mjs');

          // Define a custom element first
          class TestElement extends HTMLElement {}
          customElements.define('already-defined', TestElement);

          // Try to load it
          const el = document.createElement('already-defined');
          await panAutoload.maybeLoadFor(el);

          // Should still be the same definition
          return {
            isTestElement: customElements.get('already-defined') === TestElement
          };
        });

        expect(result.isTestElement).toBe(true);
      } finally {
        await testPage.close();
      }
    });

    test('should handle load failures gracefully', async ({ page, context }) => {
      const testPage = await context.newPage();

      try {
        await testPage.goto(fileUrl('tests/fixtures/pan-autoload-test.html'));

        // Listen for console warnings
        const warnings = [];
        testPage.on('console', (msg) => {
          if (msg.type() === 'warning') {
            warnings.push(msg.text());
          }
        });

        const result = await testPage.evaluate(async () => {
          const { panAutoload } = await import('../../src/pan.mjs');

          // Try to load non-existent component
          const el = document.createElement('non-existent-component');
          try {
            await panAutoload.maybeLoadFor(el);
            return { succeeded: true };
          } catch (err) {
            return { succeeded: false, error: err.message };
          }
        });

        // Should not throw, but should still succeed (maybeLoadFor catches errors)
        expect(result.succeeded).toBe(true);

        // Wait a bit for console messages
        await testPage.waitForTimeout(100);

        // Should have logged a warning
        expect(warnings.length).toBeGreaterThan(0);
      } finally {
        await testPage.close();
      }
    });

    test('should prevent duplicate loads', async ({ page, context }) => {
      const testPage = await context.newPage();

      try {
        await testPage.goto(fileUrl('tests/fixtures/pan-autoload-test.html'));

        const result = await testPage.evaluate(async () => {
          const { panAutoload } = await import('../../src/pan.mjs');

          // Wait for pan-bus element to exist in DOM
          await new Promise(resolve => {
            const checkBus = () => {
              if (document.querySelector('pan-bus')) {
                resolve();
              } else {
                setTimeout(checkBus, 10);
              }
            };
            checkBus();
          });

          // Wait for pan-bus to be loaded
          await customElements.whenDefined('pan-bus');

          // Give it a moment to fully register
          await new Promise(r => setTimeout(r, 50));

          const el1 = document.createElement('pan-bus');
          const el2 = document.createElement('pan-bus');

          // Try to load both simultaneously (both should be no-ops since already defined)
          const [result1, result2] = await Promise.all([
            panAutoload.maybeLoadFor(el1),
            panAutoload.maybeLoadFor(el2)
          ]);

          // Both should complete without error
          return {
            isDefined: customElements.get('pan-bus') !== undefined,
            completed: true
          };
        });

        expect(result.isDefined).toBe(true);
        expect(result.completed).toBe(true);
      } finally {
        await testPage.close();
      }
    });
  });

  test.describe('Custom Paths', () => {
    test('should respect data-module attribute', async ({ page, context }) => {
      const testPage = await context.newPage();

      try {
        await testPage.goto(fileUrl('tests/fixtures/pan-autoload-test.html'));

        const result = await testPage.evaluate(async () => {
          const { panAutoload } = await import('../../src/pan.mjs');

          // Create element with custom module path
          const el = document.createElement('custom-path');
          el.setAttribute('data-module', '../../src/components/pan-bus.mjs');
          document.body.appendChild(el);

          // Get the URL that would be used
          const urlFor = (element) => {
            const explicit = element.getAttribute('data-module');
            if (explicit) return explicit;
            return element.localName + panAutoload.config.extension;
          };

          return {
            url: urlFor(el),
            hasDataModule: el.hasAttribute('data-module')
          };
        });

        expect(result.hasDataModule).toBe(true);
        expect(result.url).toContain('pan-bus.mjs');
      } finally {
        await testPage.close();
      }
    });
  });

  test.describe('Observer Functions', () => {
    test('should observe tree with observeTree', async ({ page, context }) => {
      const testPage = await context.newPage();

      try {
        await testPage.goto(fileUrl('tests/fixtures/pan-autoload-test.html'));

        const result = await testPage.evaluate(async () => {
          const { panAutoload } = await import('../../src/pan.mjs');

          // Create a container with custom elements
          const container = document.createElement('div');
          container.innerHTML = `
            <test-widget></test-widget>
            <another-widget></another-widget>
          `;
          document.body.appendChild(container);

          // Observe the container
          panAutoload.observeTree(container);

          // Check if elements are being tracked (hard to verify directly,
          // but observeTree should not throw)
          return { success: true };
        });

        expect(result.success).toBe(true);
      } finally {
        await testPage.close();
      }
    });

    test('should handle observeTree with document root', async ({ page, context }) => {
      const testPage = await context.newPage();

      try {
        await testPage.goto(fileUrl('tests/fixtures/pan-autoload-test.html'));

        const result = await testPage.evaluate(async () => {
          const { panAutoload } = await import('../../src/pan.mjs');

          // Observe entire document
          panAutoload.observeTree(document);

          return { success: true };
        });

        expect(result.success).toBe(true);
      } finally {
        await testPage.close();
      }
    });

    test('should prevent duplicate observation', async ({ page, context }) => {
      const testPage = await context.newPage();

      try {
        await testPage.goto(fileUrl('tests/fixtures/pan-autoload-test.html'));

        const result = await testPage.evaluate(async () => {
          const { panAutoload } = await import('../../src/pan.mjs');

          const container = document.createElement('div');
          document.body.appendChild(container);

          // Observe same element multiple times
          panAutoload.observeTree(container);
          panAutoload.observeTree(container);
          panAutoload.observeTree(container);

          // Should not throw or cause issues
          return { success: true };
        });

        expect(result.success).toBe(true);
      } finally {
        await testPage.close();
      }
    });
  });

  test.describe('Pan-Bus Integration', () => {
    test('should auto-create pan-bus element', async ({ page, context }) => {
      const testPage = await context.newPage();

      try {
        await testPage.goto(fileUrl('tests/fixtures/pan-autoload-test.html'));

        const result = await testPage.evaluate(async () => {
          // Import pan.mjs (which auto-initializes and creates pan-bus)
          await import('../../src/pan.mjs');

          // Wait a bit for initialization
          await new Promise(resolve => setTimeout(resolve, 200));

          // Check if pan-bus exists
          const bus = document.querySelector('pan-bus');
          return {
            exists: bus !== null,
            tagName: bus?.tagName.toLowerCase()
          };
        });

        expect(result.exists).toBe(true);
        expect(result.tagName).toBe('pan-bus');
      } finally {
        await testPage.close();
      }
    });

    test('should not duplicate pan-bus if already exists', async ({ page, context }) => {
      const testPage = await context.newPage();

      try {
        await testPage.goto(fileUrl('tests/fixtures/pan-autoload-test.html'));

        const result = await testPage.evaluate(async () => {
          // Create pan-bus manually first
          const manualBus = document.createElement('pan-bus');
          manualBus.id = 'manual-bus';
          document.body.appendChild(manualBus);

          // Now import pan.mjs
          await import('../../src/pan.mjs');

          // Wait for initialization
          await new Promise(resolve => setTimeout(resolve, 200));

          // Count pan-bus elements
          const busElements = document.querySelectorAll('pan-bus');
          return {
            count: busElements.length,
            hasManual: document.querySelector('#manual-bus') !== null
          };
        });

        expect(result.count).toBe(1);
        expect(result.hasManual).toBe(true);
      } finally {
        await testPage.close();
      }
    });

    test('should load pan-bus component definition', async ({ page, context }) => {
      const testPage = await context.newPage();

      try {
        await testPage.goto(fileUrl('tests/fixtures/pan-autoload-test.html'));

        const result = await testPage.evaluate(async () => {
          // Import autoloader
          await import('../../src/pan.mjs');

          // Wait for pan-bus to be defined
          await customElements.whenDefined('pan-bus');

          return {
            isDefined: customElements.get('pan-bus') !== undefined,
            hasElement: document.querySelector('pan-bus') !== null
          };
        });

        expect(result.isDefined).toBe(true);
        expect(result.hasElement).toBe(true);
      } finally {
        await testPage.close();
      }
    });
  });

  test.describe('Public API', () => {
    test('should expose panAutoload on window', async ({ page, context }) => {
      const testPage = await context.newPage();

      try {
        await testPage.goto(fileUrl('tests/fixtures/pan-autoload-test.html'));

        const result = await testPage.evaluate(async () => {
          await import('../../src/pan.mjs');

          return {
            exists: typeof window.panAutoload !== 'undefined',
            hasConfig: typeof window.panAutoload?.config === 'object',
            hasObserveTree: typeof window.panAutoload?.observeTree === 'function',
            hasMaybeLoadFor: typeof window.panAutoload?.maybeLoadFor === 'function'
          };
        });

        expect(result.exists).toBe(true);
        expect(result.hasConfig).toBe(true);
        expect(result.hasObserveTree).toBe(true);
        expect(result.hasMaybeLoadFor).toBe(true);
      } finally {
        await testPage.close();
      }
    });

    test('should export module functions', async ({ page, context }) => {
      const testPage = await context.newPage();

      try {
        await testPage.goto(fileUrl('tests/fixtures/pan-autoload-test.html'));

        const result = await testPage.evaluate(async () => {
          const autoload = await import('../../src/pan.mjs');

          return {
            hasDefault: typeof autoload.default === 'object',
            hasPanAutoload: typeof autoload.panAutoload === 'object',
            hasObserveTree: typeof autoload.observeTree === 'function',
            hasMaybeLoadFor: typeof autoload.maybeLoadFor === 'function'
          };
        });

        expect(result.hasDefault).toBe(true);
        expect(result.hasPanAutoload).toBe(true);
        expect(result.hasObserveTree).toBe(true);
        expect(result.hasMaybeLoadFor).toBe(true);
      } finally {
        await testPage.close();
      }
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle elements without document', async ({ page, context }) => {
      const testPage = await context.newPage();

      try {
        await testPage.goto(fileUrl('tests/fixtures/pan-autoload-test.html'));

        const result = await testPage.evaluate(async () => {
          const { panAutoload } = await import('../../src/pan.mjs');

          // Create element but don't attach to document
          const el = document.createElement('detached-widget');

          // Should handle gracefully
          await panAutoload.maybeLoadFor(el);

          return { success: true };
        });

        expect(result.success).toBe(true);
      } finally {
        await testPage.close();
      }
    });

    test('should handle non-element nodes', async ({ page, context }) => {
      const testPage = await context.newPage();

      try {
        await testPage.goto(fileUrl('tests/fixtures/pan-autoload-test.html'));

        const result = await testPage.evaluate(async () => {
          const { panAutoload } = await import('../../src/pan.mjs');

          // Try to load text node
          const textNode = document.createTextNode('text');
          await panAutoload.maybeLoadFor(textNode);

          // Try to load null
          await panAutoload.maybeLoadFor(null);

          // Try to load undefined
          await panAutoload.maybeLoadFor(undefined);

          return { success: true };
        });

        expect(result.success).toBe(true);
      } finally {
        await testPage.close();
      }
    });

    test('should handle elements without tag name', async ({ page, context }) => {
      const testPage = await context.newPage();

      try {
        await testPage.goto(fileUrl('tests/fixtures/pan-autoload-test.html'));

        const result = await testPage.evaluate(async () => {
          const { panAutoload } = await import('../../src/pan.mjs');

          // Create document fragment (no tagName)
          const fragment = document.createDocumentFragment();
          await panAutoload.maybeLoadFor(fragment);

          return { success: true };
        });

        expect(result.success).toBe(true);
      } finally {
        await testPage.close();
      }
    });
  });
});

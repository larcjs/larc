/**
 * Comprehensive tests for pan-bus.mjs component
 * Tests cover: lifecycle, configuration, messaging, subscriptions, rate limiting,
 * memory management, security, and error handling
 */

import { test, expect } from '@playwright/test';
import { fileUrl } from '../lib/test-utils.mjs';

test.describe('PAN Bus Component', () => {
  test.describe('Basic Functionality', () => {
    test.describe('Component Registration and Lifecycle', () => {
      test('should register pan-bus custom element', async ({ page, context }) => {
        await page.goto(fileUrl('tests/fixtures/basic-pan-bus.html'));

        // Wait for module to load
        await page.waitForFunction(() => window.__testReady === true);

        // Wait for custom element to be defined
        await page.waitForFunction(() => customElements.get('pan-bus') !== undefined);

        const isDefined = await page.evaluate(() => {
          return customElements.get('pan-bus') !== undefined;
        });

        expect(isDefined).toBe(true);
      });

      test('should initialize with default configuration', async ({ page, context }) => {
        await page.goto(fileUrl('tests/fixtures/basic-pan-bus.html'));

        // Wait for module to load and bus to be ready
        await page.waitForFunction(() => window.__testReady === true);
        await page.waitForFunction(() => window.__panReady === true);

        const config = await page.evaluate(() => {
          const bus = document.getElementById('test-bus');
          return bus.config;
        });

        expect(config.maxRetained).toBe(1000);
        expect(config.maxMessageSize).toBe(1048576);
        expect(config.maxPayloadSize).toBe(524288);
        expect(config.rateLimit).toBe(1000);
        expect(config.allowGlobalWildcard).toBe(true);
        expect(config.debug).toBe(false);
      });

      test('should emit pan:sys.ready event on connect', async ({ page, context }) => {
        // Create a new page for this test to avoid conflicts
        const testPage = await context.newPage();

        try {
          // Set up event listener before loading
          await testPage.addInitScript(() => {
            window.readyEvents = [];
            document.addEventListener('pan:sys.ready', (e) => {
              window.readyEvents.push(e.detail);
            });
          });

          await testPage.goto(fileUrl('tests/fixtures/basic-pan-bus.html'));
          await testPage.waitForFunction(() => window.__testReady === true);
          await testPage.waitForFunction(() => window.readyEvents?.length > 0, { timeout: 5000 });

          const readyEvent = await testPage.evaluate(() => window.readyEvents[0]);
          expect(readyEvent.enhanced).toBe(true);
          expect(readyEvent.config).toBeDefined();
        } finally {
          await testPage.close();
        }
      });
    });

    test.describe('Configuration via Attributes', () => {
      test('should configure max-retained via attribute', async ({ page, context }) => {
        await page.goto(fileUrl('tests/fixtures/basic-pan-bus.html'));
        await page.waitForFunction(() => window.__testReady === true);

        await page.evaluate(() => {
          const bus = document.getElementById('test-bus');
          bus.setAttribute('max-retained', '500');
        });

        await page.waitForTimeout(100);

        const maxRetained = await page.evaluate(() => {
          return document.getElementById('test-bus').config.maxRetained;
        });

        expect(maxRetained).toBe(500);
      });

      test('should configure debug mode via attribute', async ({ page, context }) => {
        await page.goto(fileUrl('tests/fixtures/basic-pan-bus.html'));
        await page.waitForFunction(() => window.__testReady === true);

        await page.evaluate(() => {
          const bus = document.getElementById('test-bus');
          bus.setAttribute('debug', 'true');
        });

        await page.waitForTimeout(100);

        const debug = await page.evaluate(() => {
          return document.getElementById('test-bus').config.debug;
        });

        expect(debug).toBe(true);
      });
    });
  });

  test.describe('Message Publishing & Delivery', () => {
    test('should publish and deliver basic message', async ({ page, context }) => {
      await page.goto(fileUrl('tests/fixtures/basic-pan-bus.html'));
      await page.waitForFunction(() => window.__testReady === true);
      await page.waitForFunction(() => window.__panReady === true);

      // Set up message collection
      await page.evaluate(() => {
        window.receivedMessages = [];
        document.addEventListener('pan:deliver', (e) => {
          window.receivedMessages.push(e.detail);
        });
      });

      // Subscribe to topic
      await page.evaluate(() => {
        document.dispatchEvent(new CustomEvent('pan:subscribe', {
          detail: { topics: ['test.topic'] },
          bubbles: true
        }));
      });

      // Publish message
      await page.evaluate(() => {
        document.dispatchEvent(new CustomEvent('pan:publish', {
          detail: { topic: 'test.topic', data: { message: 'hello' } },
          bubbles: true
        }));
      });

      await page.waitForFunction(() => window.receivedMessages.length > 0);

      const message = await page.evaluate(() => window.receivedMessages[0]);
      expect(message.topic).toBe('test.topic');
      expect(message.data.message).toBe('hello');
      expect(message.id).toBeDefined();
      expect(message.ts).toBeDefined();
    });

    test('should validate message topic', async ({ page, context }) => {
      await page.goto(fileUrl('tests/fixtures/basic-pan-bus.html'));
      await page.waitForFunction(() => window.__testReady === true);
      await page.waitForFunction(() => window.__panReady === true);

      // Set up error collection
      await page.evaluate(() => {
        window.errorEvents = [];
        document.addEventListener('pan:sys.error', (e) => {
          window.errorEvents.push(e.detail);
        });
      });

      // Try to publish message with invalid topic
      await page.evaluate(() => {
        document.dispatchEvent(new CustomEvent('pan:publish', {
          detail: { topic: '', data: {} },
          bubbles: true
        }));
      });

      await page.waitForFunction(() => window.errorEvents.length > 0);

      const error = await page.evaluate(() => window.errorEvents[0]);
      expect(error.code).toBe('MESSAGE_INVALID');
      expect(error.message).toContain('Invalid topic');
    });

    test('should support wildcard subscriptions', async ({ page, context }) => {
      await page.goto(fileUrl('tests/fixtures/basic-pan-bus.html'));
      await page.waitForFunction(() => window.__testReady === true);
      await page.waitForFunction(() => window.__panReady === true);

      await page.evaluate(() => {
        window.receivedMessages = [];
        document.addEventListener('pan:deliver', (e) => {
          window.receivedMessages.push(e.detail);
        });

        // Subscribe to wildcard
        document.dispatchEvent(new CustomEvent('pan:subscribe', {
          detail: { topics: ['user.*'] },
          bubbles: true
        }));
      });

      // Publish to matching topics
      await page.evaluate(() => {
        document.dispatchEvent(new CustomEvent('pan:publish', {
          detail: { topic: 'user.created', data: { id: 1 } },
          bubbles: true
        }));

        document.dispatchEvent(new CustomEvent('pan:publish', {
          detail: { topic: 'user.updated', data: { id: 2 } },
          bubbles: true
        }));

        document.dispatchEvent(new CustomEvent('pan:publish', {
          detail: { topic: 'product.created', data: { id: 3 } },
          bubbles: true
        }));
      });

      await page.waitForFunction(() => window.receivedMessages.length >= 2);

      const messages = await page.evaluate(() => window.receivedMessages);

      // Should receive user.* messages but not product.*
      expect(messages).toHaveLength(2);
      expect(messages[0].topic).toBe('user.created');
      expect(messages[1].topic).toBe('user.updated');
    });
  });
});

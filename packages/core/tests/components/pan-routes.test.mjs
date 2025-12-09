/**
 * Tests for PAN Routes - Runtime-configurable message routing
 */

import { test, expect } from '@playwright/test';

test.describe('PAN Routes - Route Management', () => {
  let page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await page.goto('http://localhost:8080/core/tests/fixtures/pan-routes-test.html');
    await page.waitForFunction(() => window.__testReady === true);
    await page.waitForFunction(() => window.__panReady === true);
  });

  test('should add a route', async () => {
    const result = await page.evaluate(() => {
      const route = window.pan.routes.add({
        name: 'Test Route',
        match: { type: 'test.message' },
        actions: [{ type: 'LOG', level: 'info' }]
      });

      return {
        hasId: !!route.id,
        name: route.name,
        enabled: route.enabled
      };
    });

    expect(result.hasId).toBe(true);
    expect(result.name).toBe('Test Route');
    expect(result.enabled).toBe(true);
  });

  test('should list routes', async () => {
    const count = await page.evaluate(() => {
      window.pan.routes.add({
        name: 'Route 1',
        match: { type: 'test.1' },
        actions: [{ type: 'LOG' }]
      });

      window.pan.routes.add({
        name: 'Route 2',
        match: { type: 'test.2' },
        actions: [{ type: 'LOG' }]
      });

      const routes = window.pan.routes.list();
      return routes.length;
    });

    expect(count).toBe(2);
  });

  test('should update a route', async () => {
    const newName = await page.evaluate(() => {
      const route = window.pan.routes.add({
        name: 'Original Name',
        match: { type: 'test' },
        actions: [{ type: 'LOG' }]
      });

      window.pan.routes.update(route.id, { name: 'Updated Name' });
      const updated = window.pan.routes.list().find(r => r.id === route.id);
      return updated.name;
    });

    expect(newName).toBe('Updated Name');
  });

  test('should remove a route', async () => {
    const count = await page.evaluate(() => {
      const route = window.pan.routes.add({
        name: 'To Remove',
        match: { type: 'test' },
        actions: [{ type: 'LOG' }]
      });

      window.pan.routes.remove(route.id);
      return window.pan.routes.list().length;
    });

    expect(count).toBe(0);
  });

  test('should enable and disable routes', async () => {
    const result = await page.evaluate(() => {
      const route = window.pan.routes.add({
        name: 'Toggle Route',
        enabled: true,
        match: { type: 'test' },
        actions: [{ type: 'LOG' }]
      });

      window.pan.routes.disable(route.id);
      const afterDisable = window.pan.routes.list().find(r => r.id === route.id).enabled;

      window.pan.routes.enable(route.id);
      const afterEnable = window.pan.routes.list().find(r => r.id === route.id).enabled;

      return { afterDisable, afterEnable };
    });

    expect(result.afterDisable).toBe(false);
    expect(result.afterEnable).toBe(true);
  });

  test('should clear all routes', async () => {
    const count = await page.evaluate(() => {
      window.pan.routes.add({ name: 'R1', match: { type: 't1' }, actions: [{ type: 'LOG' }] });
      window.pan.routes.add({ name: 'R2', match: { type: 't2' }, actions: [{ type: 'LOG' }] });
      window.pan.routes.clear();
      return window.pan.routes.list().length;
    });

    expect(count).toBe(0);
  });
});

test.describe('PAN Routes - Message Matching', () => {
  let page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await page.goto('http://localhost:8080/core/tests/fixtures/pan-routes-test.html');
    await page.waitForFunction(() => window.__testReady === true);
    await page.waitForFunction(() => window.__panReady === true);
  });

  test('should match by type', async () => {
    const matched = await page.evaluate(() => {
      return new Promise((resolve) => {
        let matchCount = 0;

        window.pan.routes.add({
          name: 'Type Matcher',
          match: { topic: 'user.login' },
          actions: [{
            type: 'CALL',
            handlerId: 'counter'
          }]
        });

        window.pan.routes.registerHandler('counter', () => {
          matchCount++;
        });

        // Should match
        window.pan.bus.publish('user.login', { id: 1 });

        // Should not match
        window.pan.bus.publish('user.logout', { id: 1 });

        setTimeout(() => resolve(matchCount), 100);
      });
    });

    expect(matched).toBe(1);
  });

  test('should match by topic', async () => {
    const matched = await page.evaluate(() => {
      return new Promise((resolve) => {
        let matchCount = 0;

        window.pan.routes.add({
          name: 'Topic Matcher',
          match: { topic: 'user.data' },
          actions: [{
            type: 'CALL',
            handlerId: 'counter'
          }]
        });

        window.pan.routes.registerHandler('counter', () => {
          matchCount++;
        });

        window.pan.bus.publish('user.data', { id: 1 });
        window.pan.bus.publish('product.data', { id: 2 });

        setTimeout(() => resolve(matchCount), 100);
      });
    });

    expect(matched).toBe(1);
  });

  test('should match by multiple types', async () => {
    const matched = await page.evaluate(() => {
      return new Promise((resolve) => {
        let matchCount = 0;

        window.pan.routes.add({
          name: 'Multi Type Matcher',
          match: { topic: ['user.login', 'user.signup'] },
          actions: [{
            type: 'CALL',
            handlerId: 'counter'
          }]
        });

        window.pan.routes.registerHandler('counter', () => {
          matchCount++;
        });

        window.pan.bus.publish('user.login', {});
        window.pan.bus.publish('user.signup', {});
        window.pan.bus.publish('user.logout', {});

        setTimeout(() => resolve(matchCount), 100);
      });
    });

    expect(matched).toBe(2);
  });

  test('should match by tags (any)', async () => {
    const matched = await page.evaluate(() => {
      return new Promise((resolve) => {
        let matchCount = 0;

        window.pan.routes.add({
          name: 'Tag Matcher (Any)',
          match: { tagsAny: ['important', 'urgent'] },
          actions: [{
            type: 'CALL',
            handlerId: 'counter'
          }]
        });

        window.pan.routes.registerHandler('counter', () => {
          matchCount++;
        });

        window.pan.bus.publish('msg1', {}, { meta: { tags: ['important'] } });
        window.pan.bus.publish('msg2', {}, { meta: { tags: ['urgent'] } });
        window.pan.bus.publish('msg3', {}, { meta: { tags: ['normal'] } });

        setTimeout(() => resolve(matchCount), 100);
      });
    });

    expect(matched).toBe(2);
  });

  test('should match by tags (all)', async () => {
    const matched = await page.evaluate(() => {
      return new Promise((resolve) => {
        let matchCount = 0;

        window.pan.routes.add({
          name: 'Tag Matcher (All)',
          match: { tagsAll: ['important', 'urgent'] },
          actions: [{
            type: 'CALL',
            handlerId: 'counter'
          }]
        });

        window.pan.routes.registerHandler('counter', () => {
          matchCount++;
        });

        window.pan.bus.publish('msg1', {}, { meta: { tags: ['important', 'urgent'] } });
        window.pan.bus.publish('msg2', {}, { meta: { tags: ['important'] } });
        window.pan.bus.publish('msg3', {}, { meta: { tags: ['urgent'] } });

        setTimeout(() => resolve(matchCount), 100);
      });
    });

    expect(matched).toBe(1);
  });
});


test.describe('PAN Routes - Actions', () => {
  let page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await page.goto('http://localhost:8080/core/tests/fixtures/pan-routes-test.html');
    await page.waitForFunction(() => window.__testReady === true);
    await page.waitForFunction(() => window.__panReady === true);
  });

  test('should execute EMIT action', async () => {
    const received = await page.evaluate(() => {
      return new Promise((resolve) => {
        const messages = [];

        window.pan.routes.add({
          name: 'Emit Action',
          match: { topic: 'trigger' },
          actions: [{
            type: 'EMIT',
            message: { type: 'emitted', payload: { test: true } }
          }]
        });

        window.pan.bus.subscribe('emitted', (msg) => {
          messages.push(msg);
          if (messages.length === 1) {
            resolve(messages[0].payload);
          }
        });

        window.pan.bus.publish('trigger', {});
      });
    });

    expect(received.test).toBe(true);
  });


  test('should execute CALL action', async () => {
    const handlerCalled = await page.evaluate(() => {
      return new Promise((resolve) => {
        let called = false;

        window.pan.routes.registerHandler('myHandler', (msg) => {
          called = true;
          resolve(called);
        });

        window.pan.routes.add({
          name: 'Call Action',
          match: { topic: 'trigger' },
          actions: [{
            type: 'CALL',
            handlerId: 'myHandler'
          }]
        });

        window.pan.bus.publish('trigger', {});
      });
    });

    expect(handlerCalled).toBe(true);
  });

  test('should execute multiple actions', async () => {
    const results = await page.evaluate(() => {
      return new Promise((resolve) => {
        let emitReceived = false;
        let handlerCalled = false;

        window.pan.routes.registerHandler('multi', () => {
          handlerCalled = true;
          if (emitReceived && handlerCalled) {
            resolve({ emitReceived, handlerCalled });
          }
        });

        window.pan.routes.add({
          name: 'Multi Action',
          match: { topic: 'trigger' },
          actions: [
            { type: 'EMIT', message: { type: 'emitted' } },
            { type: 'CALL', handlerId: 'multi' }
          ]
        });

        window.pan.bus.subscribe('emitted', () => {
          emitReceived = true;
          if (emitReceived && handlerCalled) {
            resolve({ emitReceived, handlerCalled });
          }
        });

        window.pan.bus.publish('trigger', {});
      });
    });

    expect(results.emitReceived).toBe(true);
    expect(results.handlerCalled).toBe(true);
  });
});

test.describe('PAN Routes - Control Messages', () => {
  let page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await page.goto('http://localhost:8080/core/tests/fixtures/pan-routes-test.html');
    await page.waitForFunction(() => window.__testReady === true);
    await page.waitForFunction(() => window.__panReady === true);
  });

  test('should add route via control message', async () => {
    const count = await page.evaluate(() => {
      document.dispatchEvent(new CustomEvent('pan:control', {
        detail: {
          type: 'pan.routes.add',
          payload: {
            route: {
              name: 'Control Added',
              match: { type: 'test' },
              actions: [{ type: 'LOG' }]
            }
          }
        }
      }));

      return window.pan.routes.list().length;
    });

    expect(count).toBe(1);
  });

  test('should remove route via control message', async () => {
    const count = await page.evaluate(() => {
      const route = window.pan.routes.add({
        name: 'To Remove',
        match: { type: 'test' },
        actions: [{ type: 'LOG' }]
      });

      document.dispatchEvent(new CustomEvent('pan:control', {
        detail: {
          type: 'pan.routes.remove',
          payload: { id: route.id }
        }
      }));

      return window.pan.routes.list().length;
    });

    expect(count).toBe(0);
  });

  test('should list routes via control message', async () => {
    const count = await page.evaluate(() => {
      window.pan.routes.add({
        name: 'R1',
        match: { type: 't1' },
        actions: [{ type: 'LOG' }]
      });

      const result = window.pan.routes.handleControlMessage({
        type: 'pan.routes.list',
        payload: {}
      });

      return result.length;
    });

    expect(count).toBe(1);
  });
});

test.describe('PAN Routes - Statistics', () => {
  let page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await page.goto('http://localhost:8080/core/tests/fixtures/pan-routes-test.html');
    await page.waitForFunction(() => window.__testReady === true);
    await page.waitForFunction(() => window.__panReady === true);
  });


  test('should reset statistics', async () => {
    const stats = await page.evaluate(() => {
      window.pan.routes.add({
        name: 'Test',
        match: { type: 'test' },
        actions: [{ type: 'LOG' }]
      });

      window.pan.bus.publish('test', {});
      window.pan.routes.resetStats();

      return window.pan.routes.getStats();
    });

    expect(stats.routesEvaluated).toBe(0);
    expect(stats.routesMatched).toBe(0);
  });
});

test.describe('PAN Routes - Integration', () => {
  let page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await page.goto('http://localhost:8080/core/tests/fixtures/pan-routes-test.html');
    await page.waitForFunction(() => window.__testReady === true);
    await page.waitForFunction(() => window.__panReady === true);
  });

  test('should integrate with PAN bus message flow', async () => {
    const received = await page.evaluate(() => {
      return new Promise((resolve) => {
        let normalReceived = false;
        let routedReceived = false;

        // Normal subscription
        window.pan.bus.subscribe('original', () => {
          normalReceived = true;
          if (normalReceived && routedReceived) {
            resolve({ normalReceived, routedReceived });
          }
        });

        // Route that emits additional message
        window.pan.routes.add({
          name: 'Integration Route',
          match: { topic: 'original' },
          actions: [{
            type: 'EMIT',
            message: { type: 'routed' }
          }]
        });

        window.pan.bus.subscribe('routed', () => {
          routedReceived = true;
          if (normalReceived && routedReceived) {
            resolve({ normalReceived, routedReceived });
          }
        });

        window.pan.bus.publish('original', {});
      });
    });

    expect(received.normalReceived).toBe(true);
    expect(received.routedReceived).toBe(true);
  });


  test('should handle complex routing chains', async () => {
    const results = await page.evaluate(() => {
      return new Promise((resolve) => {
        const chain = [];

        // Step 1: Original -> Intermediate
        window.pan.routes.add({
          name: 'Chain Step 1',
          match: { topic: 'original' },
          actions: [{
            type: 'EMIT',
            message: { type: 'intermediate', payload: { step: 1 } }
          }]
        });

        // Step 2: Intermediate -> Final
        window.pan.routes.add({
          name: 'Chain Step 2',
          match: { topic: 'intermediate' },
          actions: [{
            type: 'EMIT',
            message: { type: 'final', payload: { step: 2 } }
          }]
        });

        window.pan.bus.subscribe('original', (msg) => {
          chain.push('original');
        });

        window.pan.bus.subscribe('intermediate', (msg) => {
          chain.push('intermediate');
        });

        window.pan.bus.subscribe('final', (msg) => {
          chain.push('final');
          resolve(chain);
        });

        window.pan.bus.publish('original', {});
      });
    });

    expect(results).toContain('original');
    expect(results).toContain('intermediate');
    expect(results).toContain('final');
  });
});

/**
 * Regression tests for two PAN bus bugs (fixed in 3.0.2):
 *
 *  1. Deliveries leaked between subscriptions sharing a host element
 *     (duplicate delivery, retained replay hitting every subscription, ...).
 *  2. bus.clients / bus.subs grew forever; subscriptions on removed elements were never pruned.
 *
 * Every shipped bus/client variant must behave identically, so each test runs against all of them.
 */

import { test, expect } from '@playwright/test';
import { fileUrl } from '../lib/test-utils.mjs';

// `key` selects the matching entry in tests/fixtures/pan-delivery-test.html
const VARIANTS = [
  { name: 'index.js (unified)',          key: 'index' },
  { name: 'pan-bus.mjs (enhanced)',      key: 'enhanced' },
  { name: 'pan-bus-lite.mjs',            key: 'lite' },
  { name: 'components/pan-bus-enhanced', key: 'components-enhanced' },
  { name: 'components/pan-bus-legacy',   key: 'components-legacy' },
  { name: 'core-lite',                   key: 'core-lite' },
];

function fixture(v) {
  return `${fileUrl('tests/fixtures/pan-delivery-test.html')}?variant=${v.key}`;
}

for (const v of VARIANTS) {
  test.describe(`delivery + lifecycle: ${v.name}`, () => {
    test.beforeEach(async ({ page }) => {
      page.on('pageerror', (e) => { throw e; });
      await page.goto(fixture(v));
      await page.waitForFunction(() => window.__testReady === true && window.__panReady === true);
    });

    // ---- Bug 1: delivery ----------------------------------------------------------------

    test('1. overlapping subscriptions on document: each handler runs once per message', async ({ page }) => {
      const r = await page.evaluate(async () => {
        const c = new PanClient(); await c.ready();
        const a = [], b = [];
        c.subscribe('x.*', (m) => a.push(m.topic));
        c.subscribe('x.y', (m) => b.push(m.topic));
        c.publish({ topic: 'x.y', data: 1 });
        c.publish({ topic: 'x.z', data: 2 });
        return { a, b };
      });
      expect(r.a).toEqual(['x.y', 'x.z']);
      expect(r.b).toEqual(['x.y']);
    });

    test('2. retained replay on a new subscription does not call other subscriptions', async ({ page }) => {
      const r = await page.evaluate(async () => {
        const c = new PanClient(); await c.ready();
        c.publish({ topic: 'r.state', data: 1, retain: true });
        const a = [], b = [];
        c.subscribe('r.*', (m) => a.push(m.data), { retained: true });
        const aAfterOwnReplay = a.length;
        c.subscribe('r.state', (m) => b.push(m.data), { retained: true });
        return { aAfterOwnReplay, aAfterSecond: a.length, b };
      });
      expect(r.aAfterOwnReplay).toBe(1);
      expect(r.aAfterSecond).toBe(1);   // B's replay must not reach A
      expect(r.b).toEqual([1]);
    });

    test('3. one subscription, two matching patterns: handler runs once; no leaks from other subs', async ({ page }) => {
      const r = await page.evaluate(async () => {
        const c = new PanClient(); await c.ready();
        const h = [], other = [];
        c.subscribe(['a.*', '*.b'], (m) => h.push(m.topic));
        c.subscribe('a.q', (m) => other.push(m.topic));
        c.publish({ topic: 'a.b', data: 1 });   // matches both patterns of the first subscription
        c.publish({ topic: 'a.q', data: 2 });   // also matches the other subscription on the same host
        return { h, other };
      });
      expect(r.h).toEqual(['a.b', 'a.q']);
      expect(r.other).toEqual(['a.q']);
    });

    test('4. two subscriptions to the same pattern: unsubscribing one leaves the other working', async ({ page }) => {
      const r = await page.evaluate(async () => {
        const c = new PanClient(); await c.ready();
        const a = [], b = [];
        const offA = c.subscribe('same.topic', (m) => a.push(m.data));
        c.subscribe('same.topic', (m) => b.push(m.data));
        c.publish({ topic: 'same.topic', data: 1 });
        offA();
        c.publish({ topic: 'same.topic', data: 2 });
        return { a, b };
      });
      expect(r.a).toEqual([1]);
      expect(r.b).toEqual([1, 2]);
    });

    test('5. request() resolves once and does not disturb other subscribers on the host', async ({ page }) => {
      const r = await page.evaluate(async () => {
        const c = new PanClient(); await c.ready();
        const responder = new PanClient(); await responder.ready();
        responder.subscribe('svc.echo', (m) => responder.publish({ topic: m.replyTo, data: { echo: m.data } }));
        const spy = []; c.subscribe('svc.*', (m) => spy.push(m.topic));
        let replyDeliveries = 0;
        document.addEventListener('pan:deliver', (e) => {
          if (e.detail && String(e.detail.topic).startsWith('pan:$reply:')) replyDeliveries++;
        });
        const [r1, r2] = await Promise.all([c.request('svc.echo', 1), c.request('svc.echo', 2)]);
        return { d1: r1.data, d2: r2.data, spy, replyDeliveries, c1: r1.correlationId !== r2.correlationId };
      });
      expect(r.d1).toEqual({ echo: 1 });
      expect(r.d2).toEqual({ echo: 2 });
      expect(r.spy).toEqual(['svc.echo', 'svc.echo']);   // each request seen once, replies never
      expect(r.replyDeliveries).toBe(2);                 // exactly one delivery per reply
    });

    test('6. backward compat: untagged pan:subscribe + raw pan:deliver listener still works', async ({ page }) => {
      const r = await page.evaluate(async () => {
        const c = new PanClient(); await c.ready();
        const seen = [];
        document.addEventListener('pan:deliver', (e) => seen.push({ topic: e.detail.topic, tagged: e.panSubId !== undefined }));
        document.dispatchEvent(new CustomEvent('pan:subscribe', {
          detail: { clientId: 'manual-1', topics: ['m.*'], options: {} }, bubbles: true, composed: true,
        }));
        c.publish({ topic: 'm.x', data: 1 });
        // and a new client must still accept untagged deliveries (old bus) by pattern
        const got = [];
        c.subscribe('q.*', (m) => got.push(m.topic));
        document.dispatchEvent(new CustomEvent('pan:deliver', { detail: { topic: 'q.x', data: 1 } }));
        const tagged = new CustomEvent('pan:deliver', { detail: { topic: 'q.y', data: 1 } });
        tagged.panSubId = 'someone-elses-subscription';
        document.dispatchEvent(tagged);
        return { seen: seen.filter((s) => s.topic === 'm.x'), got };
      });
      expect(r.seen).toEqual([{ topic: 'm.x', tagged: false }]);
      expect(r.got).toEqual(['q.x']);   // foreign-tagged delivery ignored, untagged accepted
    });

    // ---- Bug 2: lifecycle ---------------------------------------------------------------

    test('7. dispose() removes client and subs; calling it twice is harmless', async ({ page }) => {
      const r = await page.evaluate(async () => {
        const bus = window.__bus;
        const c = new PanClient(); await c.ready();
        c.subscribe('d.a', () => {}); c.subscribe(['d.b', 'd.c'], () => {});
        const before = { has: bus.clients.has(c.clientId), subs: bus.subs.filter((s) => s.clientId === c.clientId).length };
        let byes = 0;
        document.addEventListener('pan:bye', (e) => { if (e.detail.id === c.clientId) byes++; });
        c.dispose();
        let threw = false;
        try { c.dispose(); } catch { threw = true; }
        const post = { has: bus.clients.has(c.clientId), subs: bus.subs.filter((s) => s.clientId === c.clientId).length };
        // subscribing after dispose must not resurrect anything
        c.subscribe('d.z', () => {});
        const afterSub = bus.subs.filter((s) => s.clientId === c.clientId).length;
        // hello re-sent with an existing id updates in place
        const size = bus.clients.size;
        for (const caps of [['one'], ['two']]) {
          document.dispatchEvent(new CustomEvent('pan:hello', { detail: { id: 'manual-hello', caps }, bubbles: true, composed: true }));
        }
        return { before, post, byes, threw, afterSub, helloGrowth: bus.clients.size - size, caps: bus.clients.get('manual-hello').caps };
      });
      expect(r.before).toEqual({ has: true, subs: 3 });
      expect(r.post).toEqual({ has: false, subs: 0 });
      expect(r.byes).toBe(1);
      expect(r.threw).toBe(false);
      expect(r.afterSub).toBe(0);
      expect(r.helloGrowth).toBe(1);
      expect(r.caps).toEqual(['two']);
    });

    test('8. creating and disposing 1,000 clients leaves clients and subs where they started', async ({ page }) => {
      const r = await page.evaluate(async () => {
        const bus = window.__bus;
        const keep = new PanClient(); await keep.ready(); keep.subscribe('keep.*', () => {});
        const start = { clients: bus.clients.size, subs: bus.subs.length };
        for (let i = 0; i < 1000; i++) {
          const c = new PanClient(); await c.ready();
          c.subscribe(['n.a', 'n.b'], () => {});
          c.dispose();
        }
        return { start, end: { clients: bus.clients.size, subs: bus.subs.length } };
      });
      expect(r.end).toEqual(r.start);
    });

    test('9. subscription on a removed host is pruned at next publish; a moved host keeps it', async ({ page }) => {
      const r = await page.evaluate(async () => {
        const bus = window.__bus;
        const pub = new PanClient(); await pub.ready();

        const gone = document.createElement('div'); document.body.append(gone);
        const moved = document.createElement('div'); document.body.append(moved);
        const cg = new PanClient(gone); await cg.ready();
        const cm = new PanClient(moved); await cm.ready();
        const hg = [], hm = [];
        cg.subscribe('p.*', (m) => hg.push(m.data));
        cm.subscribe('p.*', (m) => hm.push(m.data));

        pub.publish({ topic: 'p.t', data: 1 });
        gone.remove();                                   // removed, never reattached
        moved.remove(); document.body.append(moved);     // DOM move within the same task
        pub.publish({ topic: 'p.t', data: 2 });

        return {
          hg, hm,
          goneSub: bus.subs.some((s) => s.el === gone), goneClient: bus.clients.has(cg.clientId),
          movedSub: bus.subs.some((s) => s.el === moved), movedClient: bus.clients.has(cm.clientId),
          docSub: (() => { pub.subscribe('docsub.x', () => {}); pub.publish({ topic: 'docsub.x', data: 0 }); return bus.subs.some((s) => s.el === document); })(),
        };
      });
      expect(r.hg).toEqual([1]);
      expect(r.hm).toEqual([1, 2]);
      expect(r.goneSub).toBe(false);
      expect(r.goneClient).toBe(false);
      expect(r.movedSub).toBe(true);
      expect(r.movedClient).toBe(true);
      expect(r.docSub).toBe(true);   // document is never considered disconnected
    });
  });
}

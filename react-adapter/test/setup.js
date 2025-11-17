/**
 * Test setup file
 */

// Mock PanClient for tests
globalThis.mockPanClient = {
  subscribe: vi.fn(() => vi.fn()), // Returns unsubscribe function
  publish: vi.fn(),
  ready: vi.fn(() => Promise.resolve())
};

// Mock the @larcjs/core import
vi.mock('@larcjs/core/pan-client.mjs', () => ({
  PanClient: vi.fn(() => globalThis.mockPanClient)
}));

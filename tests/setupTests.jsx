import { cleanup } from '@testing-library/react';
import { defaultConfig } from 'antd/lib/theme/internal';

defaultConfig.hashed = false;

const pendingTimeouts = new Set();
const pendingIntervals = new Set();
const pendingAnimationFrames = new Set();

const originalSetTimeout = global.setTimeout.bind(global);
const originalClearTimeout = global.clearTimeout.bind(global);
const originalSetInterval = global.setInterval.bind(global);
const originalClearInterval = global.clearInterval.bind(global);
const originalRequestAnimationFrame = global.requestAnimationFrame
  ? global.requestAnimationFrame.bind(global)
  : (callback) => originalSetTimeout(() => callback(Date.now()), 16);
const originalCancelAnimationFrame = global.cancelAnimationFrame
  ? global.cancelAnimationFrame.bind(global)
  : (handle) => originalClearTimeout(handle);

const trackTimer = (registry, setImpl, clearImpl) => ({
  set: (...args) => {
    const handle = setImpl(...args);
    registry.add(handle);
    return handle;
  },
  clear: (handle) => {
    registry.delete(handle);
    return clearImpl(handle);
  },
});

const timeoutTracker = trackTimer(pendingTimeouts, originalSetTimeout, originalClearTimeout);
const intervalTracker = trackTimer(pendingIntervals, originalSetInterval, originalClearInterval);

global.setTimeout = timeoutTracker.set;
global.clearTimeout = timeoutTracker.clear;
global.setInterval = intervalTracker.set;
global.clearInterval = intervalTracker.clear;
global.requestAnimationFrame = (callback) => {
  let handle;
  handle = originalRequestAnimationFrame((timestamp) => {
    pendingAnimationFrames.delete(handle);
    callback(timestamp);
  });
  pendingAnimationFrames.add(handle);
  return handle;
};
global.cancelAnimationFrame = (handle) => {
  pendingAnimationFrames.delete(handle);
  return originalCancelAnimationFrame(handle);
};

const createStorageMock = () => {
  let store = {};
  return {
    getItem: jest.fn((key) => (key in store ? store[key] : null)),
    setItem: jest.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn((index) => Object.keys(store)[index] ?? null),
    get length() {
      return Object.keys(store).length;
    },
  };
};

Object.defineProperty(global, 'localStorage', {
  configurable: true,
  value: createStorageMock(),
});

Object.defineProperty(global, 'sessionStorage', {
  configurable: true,
  value: createStorageMock(),
});

Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(),
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: jest.fn(() => ({
    scale: jest.fn(),
    clearRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
  })),
});

class MessageChannelMock {
  constructor() {
    this.port1 = {
      onmessage: null,
      postMessage: jest.fn(),
      start: jest.fn(),
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    this.port2 = {
      onmessage: null,
      postMessage: jest.fn((value) => {
        if (typeof this.port1.onmessage === 'function') {
          this.port1.onmessage({ data: value });
        }
      }),
      start: jest.fn(),
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
  }
}

global.MessageChannel = MessageChannelMock;
window.MessageChannel = MessageChannelMock;

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;
window.ResizeObserver = ResizeObserverMock;
globalThis.ResizeObserver = ResizeObserverMock;

class Worker {
  constructor(stringUrl) {
    this.url = stringUrl;
    this.onmessage = () => {};
  }

  postMessage(msg) {
    this.onmessage(msg);
  }
}
window.Worker = Worker;

if (typeof window !== 'undefined') {
  window.setTimeout = global.setTimeout;
  window.clearTimeout = global.clearTimeout;
  window.setInterval = global.setInterval;
  window.clearInterval = global.clearInterval;
  window.requestAnimationFrame = global.requestAnimationFrame;
  window.cancelAnimationFrame = global.cancelAnimationFrame;

  // ref: https://github.com/ant-design/ant-design/issues/18774
  if (!window.matchMedia) {
    Object.defineProperty(global.window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: jest.fn(() => ({
        matches: false,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      })),
    });
  }
  if (!window.matchMedia) {
    Object.defineProperty(global.window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: jest.fn((query) => ({
        matches: query.includes('max-width'),
        addListener: jest.fn(),
        removeListener: jest.fn(),
      })),
    });
  }
}
const errorLog = console.error;
Object.defineProperty(global.window.console, 'error', {
  writable: true,
  configurable: true,
  value: (...rest) => {
    const logStr = rest.join('');
    if (
      logStr.includes(
        'Warning: An update to %s inside a test was not wrapped in act(...)',
      )
    ) {
      return;
    }
    errorLog(...rest);
  },
});

beforeEach(() => {
  global.localStorage.clear();
  global.sessionStorage.clear();
  jest.clearAllMocks();
});

afterEach(() => {
  cleanup();

  for (const handle of Array.from(pendingTimeouts)) {
    originalClearTimeout(handle);
    pendingTimeouts.delete(handle);
  }

  for (const handle of Array.from(pendingIntervals)) {
    originalClearInterval(handle);
    pendingIntervals.delete(handle);
  }

  for (const handle of Array.from(pendingAnimationFrames)) {
    originalCancelAnimationFrame(handle);
    pendingAnimationFrames.delete(handle);
  }
});

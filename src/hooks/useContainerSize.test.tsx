import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { useContainerSize } from './useContainerSize';

const resizeObservers: MockResizeObserver[] = [];

class MockResizeObserver {
  callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    resizeObservers.push(this);
  }

  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(global, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});

type RectRef = { current: { width: number; height: number } };

function defineRect(node: HTMLDivElement, rectRef: RectRef) {
  Object.defineProperty(node, 'getBoundingClientRect', {
    configurable: true,
    value: () => rectRef.current,
  });
}

function Harness(props: { rectRef: RectRef; parentRectRef?: RectRef; showChild?: boolean }) {
  const { rectRef, parentRectRef, showChild = true } = props;
  const { ref, width, height } = useContainerSize<HTMLDivElement>();

  return React.createElement(
    'div',
    {
      ref: (node: HTMLDivElement | null) => {
        if (node && parentRectRef) {
          defineRect(node, parentRectRef);
        }
      },
    },
    showChild ? React.createElement('div', {
      ref: (node: HTMLDivElement | null) => {
        ref(node);
        if (node) {
          defineRect(node, rectRef);
        }
      },
    }) : null,
    React.createElement('div', { 'data-testid': 'size' }, `${width}x${height}`),
  );
}

describe('useContainerSize', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resizeObservers.length = 0;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('re-measures after an initial zero-sized mount and updates once the container becomes visible', async () => {
    const rectRef = { current: { width: 0, height: 0 } };
    render(React.createElement(Harness, { rectRef }));

    expect(screen.getByTestId('size').textContent).toBe('0x0');

    rectRef.current = { width: 320, height: 240 };

    await act(async () => {
      jest.advanceTimersByTime(120);
    });

    await waitFor(() => {
      expect(screen.getByTestId('size').textContent).toBe('320x240');
    });
  });

  it('falls back to the parent element size when the measured child is still zero-sized', async () => {
    const rectRef = { current: { width: 0, height: 0 } };
    const parentRectRef = { current: { width: 640, height: 320 } };
    render(React.createElement(Harness, { rectRef, parentRectRef }));

    await waitFor(() => {
      expect(screen.getByTestId('size').textContent).toBe('640x320');
    });
  });

  it('starts observing when the measured node mounts after the initial render', async () => {
    const rectRef = { current: { width: 480, height: 260 } };
    const { rerender } = render(React.createElement(Harness, { rectRef, showChild: false }));

    expect(screen.getByTestId('size').textContent).toBe('0x0');

    rerender(React.createElement(Harness, { rectRef, showChild: true }));

    await waitFor(() => {
      expect(screen.getByTestId('size').textContent).toBe('480x260');
    });
  });
});

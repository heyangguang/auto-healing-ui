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

function Harness(props: { rectRef: { current: { width: number; height: number } } }) {
  const { rectRef } = props;
  const { ref, width, height } = useContainerSize<HTMLDivElement>();

  return React.createElement(
    React.Fragment,
    null,
    React.createElement('div', {
      ref: (node: HTMLDivElement | null) => {
        ref.current = node;
        if (node) {
          Object.defineProperty(node, 'getBoundingClientRect', {
            configurable: true,
            value: () => rectRef.current,
          });
        }
      },
    }),
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
});

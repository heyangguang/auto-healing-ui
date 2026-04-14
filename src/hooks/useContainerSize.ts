import { useCallback, useLayoutEffect, useRef, useState } from 'react';

const INITIAL_REMEASURE_ATTEMPTS = 20;
const INITIAL_REMEASURE_INTERVAL_MS = 120;
const EMPTY_SIZE = { width: 0, height: 0 };

function toRoundedSize(rect: DOMRect | { width: number; height: number }) {
    return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
    };
}

function readElementSize(element: HTMLElement) {
    const elementSize = toRoundedSize(element.getBoundingClientRect());
    if (elementSize.width > 0 && elementSize.height > 0) {
        return elementSize;
    }

    const parent = element.parentElement;
    if (!parent) {
        return elementSize;
    }

    const parentSize = toRoundedSize(parent.getBoundingClientRect());
    if (parentSize.width > 0 && parentSize.height > 0) {
        return parentSize;
    }

    return elementSize;
}

export function useContainerSize<T extends HTMLElement = HTMLDivElement>() {
    const [observeTarget, setObserveTarget] = useState<T | null>(null);
    const retryTimerRef = useRef<number | null>(null);
    const [size, setSize] = useState<{ width: number; height: number }>(EMPTY_SIZE);
    const ref = useCallback((node: T | null) => {
        setObserveTarget(node);
    }, []);

    useLayoutEffect(() => {
        if (!observeTarget) return;

        let remainingAttempts = INITIAL_REMEASURE_ATTEMPTS;
        const updateSize = (nextSize: { width: number; height: number }) => setSize((currentSize) => (
            currentSize.width === nextSize.width && currentSize.height === nextSize.height ? currentSize : nextSize
        ));
        const clearRetryTimer = () => {
            if (retryTimerRef.current != null) {
                window.clearInterval(retryTimerRef.current);
                retryTimerRef.current = null;
            }
        };
        const measure = () => {
            const nextSize = readElementSize(observeTarget);
            if (nextSize.width > 0 && nextSize.height > 0) {
                updateSize(nextSize);
                clearRetryTimer();
                return true;
            }
            return false;
        };
        const scheduleMeasure = () => {
            if (retryTimerRef.current != null || remainingAttempts <= 0) return;
            retryTimerRef.current = window.setInterval(() => {
                remainingAttempts -= 1;
                if (measure() || remainingAttempts <= 0) {
                    clearRetryTimer();
                }
            }, INITIAL_REMEASURE_INTERVAL_MS);
        };

        const resizeObserver = new ResizeObserver((entries) => {
            entries.forEach((entry) => {
                const { width, height } = entry.contentRect;
                if (width > 0 && height > 0) {
                    updateSize({ width, height });
                } else {
                    scheduleMeasure();
                }
            });
        });

        resizeObserver.observe(observeTarget);
        if (!measure()) scheduleMeasure();

        return () => {
            resizeObserver.disconnect();
            clearRetryTimer();
        };
    }, [observeTarget]);

    return { ref, width: size.width, height: size.height };
}

import { useEffect, useState, useRef } from 'react';

export function useContainerSize<T extends HTMLElement = HTMLDivElement>() {
    const ref = useRef<T>(null);
    const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

    useEffect(() => {
        if (!ref.current) return;

        const observeTarget = ref.current;
        const resizeObserver = new ResizeObserver((entries) => {
            entries.forEach((entry) => {
                // 使用 contentRect 获取内容区域尺寸（不包含 padding/border），
                // 这正是图表需要的绘制区域
                const { width, height } = entry.contentRect;
                // 只有当尺寸发生显著变化时才更新，且忽略 0 尺寸
                if (width > 0 && height > 0) {
                    setSize({ width, height });
                }
            });
        });

        resizeObserver.observe(observeTarget);

        return () => {
            resizeObserver.unobserve(observeTarget);
        };
    }, []);

    return { ref, width: size.width, height: size.height };
}

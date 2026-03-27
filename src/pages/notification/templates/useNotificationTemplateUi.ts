import { Modal, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { getTemplateVariables } from '@/services/auto-healing/notification';

export const useTemplateVariables = () => {
    const [availableVariables, setAvailableVariables] = useState<AutoHealing.TemplateVariable[]>([]);

    useEffect(() => {
        const loadVariables = async () => {
            try {
                setAvailableVariables(await getTemplateVariables());
            } catch {
                setAvailableVariables([]);
                message.error('加载模板变量失败，请稍后重试');
            }
        };
        void loadVariables();
    }, []);

    return availableVariables;
};

export const useTemplateWindowWidth = () => {
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1200,
    );

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowWidth;
};

export const useConfirmNavigation = (isDirty: boolean) => useCallback((onConfirm: () => void) => {
    if (!isDirty) {
        onConfirm();
        return;
    }

    Modal.confirm({
        title: '未保存的更改',
        content: '您有未保存的更改，切换将丢失这些更改。是否继续？',
        onOk: onConfirm,
    });
}, [isDirty]);

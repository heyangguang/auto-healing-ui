import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'antd';
import {
    HolderOutlined, MinusCircleOutlined, PlusCircleOutlined,
} from '@ant-design/icons';

export interface ColumnSettingItem {
    key: string;
    title: string;
    fixed?: boolean;
    visible: boolean;
}

interface ColumnSettingsModalProps {
    open: boolean;
    onClose: () => void;
    columns: ColumnSettingItem[];
    onConfirm: (columns: ColumnSettingItem[]) => void;
}

const ColumnSettingsModal: React.FC<ColumnSettingsModalProps> = ({
    open, onClose, columns, onConfirm,
}) => {
    const [items, setItems] = useState<ColumnSettingItem[]>([]);
    const [dragIndex, setDragIndex] = useState<number | null>(null);

    useEffect(() => {
        if (open) setItems(columns.map(c => ({ ...c })));
    }, [open, columns]);

    const visibleItems = items.filter(i => i.visible);
    const movableItems = items.filter(i => i.visible && !i.fixed);
    const hiddenItems = items.filter(i => !i.visible && !i.fixed);

    // 按原始顺序区分首部/尾部固定列
    const firstMovableIdx = visibleItems.findIndex(i => !i.fixed);
    const lastMovableIdx = visibleItems.map(i => !i.fixed).lastIndexOf(true);

    const fixedTop = firstMovableIdx > 0
        ? visibleItems.slice(0, firstMovableIdx)
        : [];
    const fixedBottom = (lastMovableIdx >= 0 && lastMovableIdx < visibleItems.length - 1)
        ? visibleItems.slice(lastMovableIdx + 1).filter(i => i.fixed)
        : [];

    // 全部都是固定列的边界情况
    const allFixed = movableItems.length === 0;
    const fixedAll = allFixed ? visibleItems.filter(i => i.fixed) : [];

    const handleRemove = (key: string) => {
        setItems(prev => prev.map(i => i.key === key ? { ...i, visible: false } : i));
    };

    const handleAdd = (key: string) => {
        setItems(prev => prev.map(i => i.key === key ? { ...i, visible: true } : i));
    };

    // 拖拽排序 — 仅非固定列参与
    const handleDragStart = (index: number) => setDragIndex(index);

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (dragIndex === null || dragIndex === index) return;

        const movableKeys = movableItems.map(i => i.key);
        const fromKey = movableKeys[dragIndex];
        const toKey = movableKeys[index];
        if (!fromKey || !toKey) return;

        const newItems = [...items];
        const fromIdx = newItems.findIndex(i => i.key === fromKey);
        const toIdx = newItems.findIndex(i => i.key === toKey);
        if (fromIdx < 0 || toIdx < 0) return;

        const [moved] = newItems.splice(fromIdx, 1);
        newItems.splice(toIdx, 0, moved);

        setItems(newItems);
        setDragIndex(index);
    };

    const handleDragEnd = () => setDragIndex(null);

    const renderFixedItem = (item: ColumnSettingItem) => (
        <li key={item.key} className="column-settings-item column-settings-item-locked">
            <span className="column-settings-item-drag" style={{ visibility: 'hidden' }}>
                <HolderOutlined />
            </span>
            <span className="column-settings-item-name">{item.title}</span>
            <span className="column-settings-item-fixed">固定</span>
        </li>
    );

    return (
        <Modal
            title="显示项目及排序"
            open={open}
            onCancel={onClose}
            width={600}
            className="column-settings-modal"
            footer={
                <div className="column-settings-footer">
                    <Button type="primary" onClick={() => { onConfirm(items); onClose(); }}>
                        继 续
                    </Button>
                    <Button onClick={onClose}>关 闭</Button>
                </div>
            }
        >
            <div className="column-settings-content">
                {/* ===== 已显示 ===== */}
                <div className="column-settings-section">
                    <div className="column-settings-section-title">已显示</div>
                    <ul className="column-settings-list">
                        {/* 全部固定（无可排序列） */}
                        {allFixed && fixedAll.map(renderFixedItem)}

                        {/* 首部固定列 */}
                        {!allFixed && fixedTop.map(renderFixedItem)}

                        {/* 可移动列 */}
                        {!allFixed && movableItems.map((item, index) => (
                            <li
                                key={item.key}
                                className="column-settings-item"
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                style={{ opacity: dragIndex === index ? 0.4 : 1 }}
                            >
                                <span className="column-settings-item-drag">
                                    <HolderOutlined />
                                </span>
                                <span className="column-settings-item-name">{item.title}</span>
                                <MinusCircleOutlined
                                    className="column-settings-item-remove"
                                    onClick={() => handleRemove(item.key)}
                                />
                            </li>
                        ))}

                        {/* 尾部固定列 */}
                        {!allFixed && fixedBottom.map(renderFixedItem)}
                    </ul>
                </div>

                {/* ===== 未显示 ===== */}
                <div className="column-settings-section">
                    <div className="column-settings-section-title">未显示</div>
                    {hiddenItems.length === 0 ? (
                        <div className="column-settings-empty">所有字段均已显示</div>
                    ) : (
                        <ul className="column-settings-list">
                            {hiddenItems.map(item => (
                                <li key={item.key} className="column-settings-item">
                                    <span className="column-settings-item-name">{item.title}</span>
                                    <PlusCircleOutlined
                                        className="column-settings-item-add"
                                        onClick={() => handleAdd(item.key)}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ColumnSettingsModal;

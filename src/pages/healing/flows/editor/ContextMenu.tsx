import React, { useCallback } from 'react';
import { DeleteOutlined } from '@ant-design/icons';

interface ContextMenuProps {
    id: string;
    top?: number;
    left?: number;
    right?: number;
    bottom?: number;
    type: 'node' | 'edge';
    onClick: () => void;
    onClose: () => void;
}

const ContextMenu = ({ top, left, right, bottom, type, onClick, onClose }: ContextMenuProps) => {
    // Prevent default context menu
    const handleClick = useCallback(() => {
        onClick();
        onClose();
    }, [onClick, onClose]);
    const setHoverBackground = (event: React.MouseEvent<HTMLDivElement>, color: string) => {
        event.currentTarget.style.background = color;
    };

    return (
        <div
            style={{
                position: 'absolute',
                top,
                left,
                right,
                bottom,
                zIndex: 100,
                background: '#fff',
                border: '1px solid #f0f0f0',
                borderRadius: 4,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                minWidth: 120,
                padding: '4px 0',
            }}
            className="context-menu"
        >
            <div
                style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    color: '#ff4d4f',
                    transition: 'background 0.2s',
                }}
                onMouseEnter={(event) => setHoverBackground(event, '#fff1f0')}
                onMouseLeave={(event) => setHoverBackground(event, 'transparent')}
                onClick={handleClick}
            >
                <DeleteOutlined />
                <span>删除{type === 'node' ? '节点' : '连线'}</span>
            </div>
        </div>
    );
};

export default ContextMenu;

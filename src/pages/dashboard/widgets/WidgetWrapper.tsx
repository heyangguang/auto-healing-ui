/**
 * Widget 通用包装组件
 * 提供统一的卡片样式、标题栏、刷新/删除操作
 *
 * 布局策略:
 * - Card body: position:relative, flex:1
 * - 内容区: position:absolute, inset:0 → 获取确定的像素尺寸
 * - Loading: 独立的 absolute 遮罩层，不包裹 children
 *   (解决 Ant Design Spin 组件内部嵌套节点破坏高度传递的问题)
 */
import { CloseOutlined, LoadingOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Tooltip, Typography } from 'antd';
import React from 'react';

interface WidgetWrapperProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    loading?: boolean;
    onRefresh?: () => void;
    onRemove?: () => void;
    isEditing?: boolean;
    extra?: React.ReactNode;
    noPadding?: boolean;
}

const WidgetWrapper: React.FC<WidgetWrapperProps> = ({
    title,
    icon,
    children,
    loading = false,
    onRefresh,
    onRemove,
    isEditing = false,
    extra,
    noPadding = false,
}) => {
    return (
        <Card
            size="small"
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 0,
                border: '1px solid #f0f0f0',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                overflow: 'hidden',
            }}
            styles={{
                header: {
                    padding: '4px 10px',
                    minHeight: 32,
                    borderBottom: '1px solid #f0f0f0',
                    background: '#fafafa',
                },
                body: {
                    flex: 1,
                    padding: 0,
                    overflow: 'hidden',
                    position: 'relative' as const,
                    minHeight: 0,
                },
            }}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {icon && <span style={{ fontSize: 14, color: '#1677ff' }}>{icon}</span>}
                    <Typography.Text strong style={{ fontSize: 13 }} ellipsis>{title}</Typography.Text>
                </div>
            }
            extra={
                <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {extra}
                    {onRefresh && (
                        <Tooltip title="刷新">
                            <Button type="text" size="small" icon={<ReloadOutlined />} onClick={(e) => { e.stopPropagation(); onRefresh(); }} style={{ fontSize: 12 }} />
                        </Tooltip>
                    )}
                    {isEditing && onRemove && (
                        <Tooltip title="移除">
                            <Button
                                type="text"
                                size="small"
                                danger
                                icon={<CloseOutlined />}
                                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                                style={{ fontSize: 12 }}
                            />
                        </Tooltip>
                    )}
                </div>
            }
        >
            {/* 内容区 — children 直接作为 flex 子元素，没有任何中间 Spin 节点 */}
            <div style={{
                position: 'absolute',
                inset: 0,
                padding: noPadding ? 0 : '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}>
                {children}
            </div>

            {/* Loading 遮罩层 — 独立的 absolute 层，不包裹 children */}
            {loading && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.65)',
                    zIndex: 10,
                }}>
                    <LoadingOutlined style={{ fontSize: 24, color: '#1677ff' }} />
                </div>
            )}
        </Card>
    );
};

export default WidgetWrapper;

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
import React, { useEffect, useRef, useState } from 'react';

const MIN_REFRESH_INDICATOR_MS = 300;

interface WidgetWrapperProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    loading?: boolean;
    onRefresh?: () => void | Promise<unknown>;
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
    const [refreshing, setRefreshing] = useState(false);
    const refreshTimerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (refreshTimerRef.current != null) {
                window.clearTimeout(refreshTimerRef.current);
            }
        };
    }, []);

    const handleRefresh = async (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        if (!onRefresh || refreshing) {
            return;
        }

        setRefreshing(true);
        const startTime = Date.now();
        try {
            await Promise.resolve(onRefresh());
        } finally {
            const elapsed = Date.now() - startTime;
            const waitTime = Math.max(MIN_REFRESH_INDICATOR_MS - elapsed, 0);
            refreshTimerRef.current = window.setTimeout(() => {
                setRefreshing(false);
                refreshTimerRef.current = null;
            }, waitTime);
        }
    };

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
                        <Tooltip title={refreshing ? '刷新中' : '刷新'}>
                            <Button
                                type="text"
                                size="small"
                                icon={refreshing ? <LoadingOutlined spin /> : <ReloadOutlined />}
                                onClick={handleRefresh}
                                style={{ fontSize: 12 }}
                            />
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
            {/* 内容区 — 初始 loading 时不渲染 children，避免空态与 loading 遮罩同时出现 */}
            {!loading && (
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
            )}

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

            {/* 手动刷新反馈 — 数据区短暂显示刷新层，让用户感知这次刷新确实发生了 */}
            {!loading && refreshing && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.48)',
                    backdropFilter: 'blur(1px)',
                    zIndex: 8,
                    pointerEvents: 'none',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 10px',
                        background: 'rgba(255,255,255,0.92)',
                        border: '1px solid #e6f4ff',
                        boxShadow: '0 2px 8px rgba(22,119,255,0.08)',
                        color: '#1677ff',
                        fontSize: 12,
                    }}>
                        <LoadingOutlined spin />
                        <span>刷新中</span>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default WidgetWrapper;

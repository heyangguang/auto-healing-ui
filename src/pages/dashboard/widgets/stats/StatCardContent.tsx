/**
 * 通用统计卡片渲染器
 * 自适应容器大小：根据可用高度自动调整字号
 */
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Statistic, Typography } from 'antd';
import React from 'react';

interface StatCardContentProps {
    value: number | string;
    suffix?: string;
    prefix?: React.ReactNode;
    precision?: number;
    description?: string;
    trend?: { value: number; isUp: boolean };
    color?: string;
    valueStyle?: React.CSSProperties;
}

const StatCardContent: React.FC<StatCardContentProps> = ({
    value,
    suffix,
    prefix,
    precision,
    description,
    trend,
    color,
    valueStyle,
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, minHeight: 0 }}>
            <Statistic
                value={value}
                suffix={suffix}
                prefix={prefix}
                precision={precision}
                valueStyle={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: color || '#1677ff',
                    lineHeight: 1.1,
                    ...valueStyle,
                }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                {description && (
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {description}
                    </Typography.Text>
                )}
                {trend && (
                    <span style={{ fontSize: 12, color: trend.isUp ? '#52c41a' : '#ff4d4f', display: 'flex', alignItems: 'center', gap: 2 }}>
                        {trend.isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                        {trend.value}%
                    </span>
                )}
            </div>
        </div>
    );
};

export default StatCardContent;

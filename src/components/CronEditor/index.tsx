import React, { useState, useEffect, useMemo } from 'react';
import { Input, Space, Tag, Typography, Tabs, Tooltip } from 'antd';
import { ClockCircleOutlined, QuestionCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

// Cron 快捷预设
const CRON_PRESETS = [
    { label: '每小时', value: '0 * * * *', desc: '每小时的第0分钟' },
    { label: '每天 00:00', value: '0 0 * * *', desc: '每天凌晨' },
    { label: '每天 02:00', value: '0 2 * * *', desc: '每天凌晨2点' },
    { label: '每天 09:00', value: '0 9 * * *', desc: '每天上午9点' },
    { label: '每周一', value: '0 0 * * 1', desc: '每周一凌晨' },
    { label: '工作日 9:00', value: '0 9 * * 1-5', desc: '周一至周五上午9点' },
    { label: '每月 1 号', value: '0 0 1 * *', desc: '每月1号凌晨' },
    { label: '每 5 分钟', value: '*/5 * * * *', desc: '每5分钟执行一次' },
    { label: '每 30 分钟', value: '*/30 * * * *', desc: '每30分钟执行一次' },
];

// 字段说明
const CRON_FIELDS = [
    { name: '分钟', range: '0-59', examples: ['0', '*/5', '0,30'] },
    { name: '小时', range: '0-23', examples: ['0', '9', '*/2'] },
    { name: '日', range: '1-31', examples: ['1', '*/7', '1,15'] },
    { name: '月', range: '1-12', examples: ['*', '1,6,12'] },
    { name: '周', range: '0-6 (周日=0)', examples: ['*', '1-5', '0,6'] },
];

interface CronEditorProps {
    value?: string;
    onChange?: (value: string) => void;
    size?: 'small' | 'middle' | 'large';
}

type CronMode = 'preset' | 'custom' | 'visual';

const isCronMode = (value: string): value is CronMode =>
    value === 'preset' || value === 'custom' || value === 'visual';

const CronEditor: React.FC<CronEditorProps> = ({ value = '', onChange, size = 'large' }) => {
    const [mode, setMode] = useState<CronMode>('preset');
    const [parts, setParts] = useState<string[]>(['0', '*', '*', '*', '*']);

    // 解析当前值
    useEffect(() => {
        if (value) {
            const valueParts = value.trim().split(/\s+/);
            if (valueParts.length === 5) {
                setParts(valueParts);
            }
        }
    }, [value]);

    // 从 parts 构建 cron 表达式
    const buildCron = (newParts: string[]) => {
        const expr = newParts.join(' ');
        onChange?.(expr);
    };

    // 更新单个字段
    const updatePart = (index: number, val: string) => {
        const newParts = [...parts];
        newParts[index] = val || '*';
        setParts(newParts);
        buildCron(newParts);
    };

    // 检查当前值是否匹配某个预设
    const matchedPreset = useMemo(() => {
        return CRON_PRESETS.find(p => p.value === value);
    }, [value]);

    // 生成下次执行时间预览
    const getNextRuns = useMemo(() => {
        try {
            const p = value.trim().split(/\s+/);
            if (p.length !== 5) return null;

            const [min, hour, , ,] = p;
            const now = new Date();
            const previews: string[] = [];

            // 确定分钟值
            let targetMin = 0;
            if (min !== '*' && !min.includes('/') && !min.includes(',')) {
                targetMin = parseInt(min, 10);
            } else if (min.startsWith('*/')) {
                targetMin = parseInt(min.slice(2), 10); // 取间隔值作为起始
            }

            // 生成预览时间
            if (hour === '*') {
                // 每小时执行：显示接下来的几个小时
                const next = new Date(now);
                next.setMinutes(targetMin);
                next.setSeconds(0);

                // 如果当前分钟已过，从下一小时开始
                if (next <= now) {
                    next.setHours(next.getHours() + 1);
                }

                for (let i = 0; i < 3; i++) {
                    previews.push(next.toLocaleString('zh-CN', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        weekday: 'short'
                    }));
                    next.setHours(next.getHours() + 1);
                }
            } else {
                // 固定小时：显示接下来的几天
                for (let i = 0; i < 3 && previews.length < 3; i++) {
                    const next = new Date(now);
                    next.setDate(now.getDate() + i);

                    if (hour !== '*' && !hour.includes('/') && !hour.includes(',')) {
                        next.setHours(parseInt(hour, 10));
                    }
                    next.setMinutes(targetMin);
                    next.setSeconds(0);

                    if (next > now) {
                        previews.push(next.toLocaleString('zh-CN', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            weekday: 'short'
                        }));
                    }
                }
            }

            return previews.length > 0 ? previews : null;
        } catch {
            return null;
        }
    }, [value]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 主表达式输入 */}
            <div>
                <Input
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
                    placeholder="0 2 * * *"
                    prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
                    suffix={
                        matchedPreset ? (
                            <Tag color="success" style={{ margin: 0 }}>
                                <CheckCircleOutlined /> {matchedPreset.label}
                            </Tag>
                        ) : value.trim().split(/\s+/).length === 5 ? (
                            <Tag color="blue" style={{ margin: 0 }}>自定义</Tag>
                        ) : null
                    }
                    size={size}
                    style={{
                        fontFamily: 'monospace',
                        fontSize: size === 'large' ? 18 : 14,
                        fontWeight: 500
                    }}
                />
            </div>

            {/* 模式切换 */}
            <Tabs
                activeKey={mode}
                onChange={(key) => {
                    if (isCronMode(key)) {
                        setMode(key);
                    }
                }}
                size="small"
                items={[
                    {
                        key: 'preset',
                        label: '快捷预设',
                        children: (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {CRON_PRESETS.map(preset => (
                                    <Tooltip key={preset.value} title={preset.desc}>
                                        <Tag
                                            style={{
                                                cursor: 'pointer',
                                                padding: '4px 12px',
                                                fontSize: 13,
                                                border: value === preset.value ? '1px solid #1890ff' : undefined,
                                                background: value === preset.value ? '#e6f7ff' : undefined
                                            }}
                                            color={value === preset.value ? 'blue' : 'default'}
                                            onClick={() => onChange?.(preset.value)}
                                        >
                                            {preset.label}
                                        </Tag>
                                    </Tooltip>
                                ))}
                            </div>
                        )
                    },
                    {
                        key: 'visual',
                        label: '可视化编辑',
                        children: (
                            <div>
                                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                                    {CRON_FIELDS.map((field, idx) => (
                                        <div key={field.name} style={{ flex: 1, textAlign: 'center' }}>
                                            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                                                {field.name}
                                            </Text>
                                            <Input
                                                value={parts[idx]}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePart(idx, e.target.value)}
                                                style={{
                                                    textAlign: 'center',
                                                    fontFamily: 'monospace',
                                                    fontWeight: 500,
                                                    width: '100%'
                                                }}
                                                size="small"
                                            />
                                            <Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 2 }}>
                                                {field.range}
                                            </Text>
                                        </div>
                                    ))}
                                </div>
                                <div style={{
                                    background: '#f5f5f5',
                                    padding: '8px 12px',
                                    borderRadius: 4,
                                    fontSize: 12,
                                    color: '#666'
                                }}>
                                    <QuestionCircleOutlined style={{ marginRight: 6 }} />
                                    <code>*</code> = 所有值，<code>*/N</code> = 每N单位，<code>1,5,10</code> = 指定值，<code>1-5</code> = 范围
                                </div>
                            </div>
                        )
                    },
                    {
                        key: 'custom',
                        label: '格式说明',
                        children: (
                            <div style={{
                                background: '#fafafa',
                                padding: 12,
                                borderRadius: 4,
                                fontFamily: 'monospace',
                                fontSize: 12
                            }}>
                                <div style={{ marginBottom: 8, fontWeight: 600 }}>
                                    ┌──── 分钟 (0-59)
                                    <br />│ ┌──── 小时 (0-23)
                                    <br />│ │ ┌──── 日 (1-31)
                                    <br />│ │ │ ┌──── 月 (1-12)
                                    <br />│ │ │ │ ┌──── 周 (0-6, 周日=0)
                                    <br />│ │ │ │ │
                                    <br />* * * * *
                                </div>
                                <div style={{ color: '#666', marginTop: 8 }}>
                                    <div><code>0 2 * * *</code> → 每天 02:00</div>
                                    <div><code>*/15 * * * *</code> → 每 15 分钟</div>
                                    <div><code>0 9 * * 1-5</code> → 工作日 09:00</div>
                                </div>
                            </div>
                        )
                    }
                ]}
            />

            {/* 下次执行预览 */}
            {getNextRuns && getNextRuns.length > 0 && (
                <div style={{
                    background: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    padding: '8px 12px',
                    borderRadius: 4,
                    overflow: 'hidden'
                }}>
                    <Text type="secondary" style={{ fontSize: 12, marginRight: 8, display: 'block', marginBottom: 6 }}>预计执行:</Text>
                    <Space size={[6, 6]} wrap style={{ width: '100%' }}>
                        {getNextRuns.map((run) => (
                            <Tag key={run} color="green" style={{ margin: 0, fontSize: 11 }}>{run}</Tag>
                        ))}
                    </Space>
                </div>
            )}
        </div>
    );
};

export default CronEditor;

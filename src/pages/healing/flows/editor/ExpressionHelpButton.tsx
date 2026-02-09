import React, { useState } from 'react';
import { Popover, Button, Typography, Table, Tag, Divider, Collapse } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

/**
 * 表达式语法帮助文档
 * 显示如何访问 context 中的数据以及可用的内置函数
 */
const ExpressionHelpContent: React.FC = () => {
    const accessExamples = [
        { type: '字典/对象', syntax: '变量.字段', example: 'incident.title', result: '获取工单标题' },
        { type: '字典/对象', syntax: '变量["字段"]', example: 'incident["raw_data"]', result: '获取原始数据' },
        { type: '列表/数组', syntax: '变量[索引]', example: 'validated_hosts[0]', result: '获取第一个主机 (索引从 0 开始)' },
        { type: '嵌套访问', syntax: '变量[索引].字段', example: 'validated_hosts[0].ip_address', result: '获取第一个主机的 IP' },
        { type: '深层嵌套', syntax: '变量.字段1.字段2', example: 'incident.raw_data.cmdb_ci', result: '获取嵌套字段' },
    ];

    const functions = [
        { name: 'join(arr, sep)', desc: '将数组连接成字符串', example: "join(hosts, ',')", result: '"host1,host2,host3"' },
        { name: 'first(arr)', desc: '获取数组第一个元素', example: 'first(validated_hosts)', result: '返回第一个主机对象' },
        { name: 'last(arr)', desc: '获取数组最后一个元素', example: 'last(validated_hosts)', result: '返回最后一个主机对象' },
        { name: 'len(arr)', desc: '获取数组长度', example: 'len(validated_hosts)', result: '返回主机数量' },
        { name: 'pluck(arr, field)', desc: '从数组中提取某字段', example: "pluck(validated_hosts, 'ip_address')", result: '返回所有 IP 的数组' },
        { name: 'split(str, sep)', desc: '将字符串分割成数组', example: "split(hosts_str, ',')", result: '返回分割后的数组' },
        { name: 'upper(str)', desc: '转大写', example: 'upper(incident.status)', result: '"OPEN"' },
        { name: 'lower(str)', desc: '转小写', example: 'lower(incident.status)', result: '"open"' },
        { name: 'trim(str)', desc: '去除首尾空格', example: 'trim(incident.title)', result: '去除空格后的字符串' },
        { name: 'replace(str, old, new)', desc: '替换字符串', example: "replace(ip, '.', '_')", result: '"192_168_1_1"' },
        { name: 'contains(str, substr)', desc: '判断是否包含', example: "contains(title, 'error')", result: 'true 或 false' },
        { name: 'toInt(val)', desc: '转为整数', example: 'toInt(incident.severity)', result: '3' },
        { name: 'toFloat(val)', desc: '转为浮点数', example: 'toFloat(value)', result: '3.14' },
        { name: 'toString(val)', desc: '转为字符串', example: 'toString(count)', result: '"5"' },
        { name: 'default(val, default)', desc: '空值时返回默认值', example: "default(incident.assignee, '未分配')", result: '原值或默认值' },
        { name: 'abs(num)', desc: '绝对值', example: 'abs(-5)', result: '5' },
        { name: 'max(a, b)', desc: '最大值', example: 'max(5, 10)', result: '10' },
        { name: 'min(a, b)', desc: '最小值', example: 'min(5, 10)', result: '5' },
    ];

    const commonPatterns = [
        { scenario: '获取所有主机 IP 列表', expression: "join(pluck(validated_hosts, 'ip_address'), ',')" },
        { scenario: '获取第一个有效主机的 IP', expression: 'first(validated_hosts).ip_address' },
        { scenario: '获取工单标题', expression: 'incident.title' },
        { scenario: '获取工单原始数据中的字段', expression: 'incident.raw_data.cmdb_ci' },
        { scenario: '获取主机数量', expression: 'len(validated_hosts)' },
        { scenario: '检查工单严重级别', expression: 'toInt(incident.severity) >= 3' },
    ];

    return (
        <div style={{ maxWidth: 550, maxHeight: 500, overflow: 'auto', padding: '4px 0' }}>
            <Collapse
                bordered={false}
                defaultActiveKey={['access', 'functions']}
                size="small"
                style={{ background: 'transparent' }}
            >
                <Panel header={<Text strong>📖 数据访问语法</Text>} key="access">
                    <Table
                        size="small"
                        dataSource={accessExamples}
                        columns={[
                            { title: '类型', dataIndex: 'type', width: 80 },
                            { title: '语法', dataIndex: 'syntax', width: 100, render: (t: string) => <code>{t}</code> },
                            { title: '示例', dataIndex: 'example', width: 180, render: (t: string) => <Tag color="blue">{t}</Tag> },
                            { title: '说明', dataIndex: 'result' },
                        ]}
                        pagination={false}
                        rowKey="example"
                    />
                </Panel>

                <Panel header={<Text strong>🔧 内置函数</Text>} key="functions">
                    <Table
                        size="small"
                        dataSource={functions}
                        columns={[
                            {
                                title: '函数',
                                dataIndex: 'name',
                                width: 170,
                                render: (t: string) => <code style={{ fontSize: 11 }}>{t}</code>
                            },
                            { title: '说明', dataIndex: 'desc', width: 120 },
                            {
                                title: '示例',
                                dataIndex: 'example',
                                render: (t: string) => <Tag color="green" style={{ fontSize: 11 }}>{t}</Tag>
                            },
                        ]}
                        pagination={false}
                        rowKey="name"
                    />
                </Panel>

                <Panel header={<Text strong>💡 常用表达式模式</Text>} key="patterns">
                    {commonPatterns.map((p, i) => (
                        <div key={i} style={{ marginBottom: 8 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>{p.scenario}：</Text>
                            <br />
                            <Tag color="purple" style={{ marginTop: 2 }}>{p.expression}</Tag>
                        </div>
                    ))}
                </Panel>
            </Collapse>

            <Divider style={{ margin: '8px 0' }} />
            <Paragraph type="secondary" style={{ fontSize: 11, marginBottom: 0 }}>
                <strong>提示：</strong>表达式基于上下文 (Context) 数据计算。常见变量包括：
                <code>incident</code>（工单）、<code>hosts</code>（主机列表）、
                <code>validated_hosts</code>（验证后的主机）、<code>execution_result</code>（执行结果）
            </Paragraph>
        </div>
    );
};

interface ExpressionHelpButtonProps {
    size?: 'small' | 'middle' | 'large';
    style?: React.CSSProperties;
}

/**
 * 表达式帮助按钮 - 用于在表达式输入区域旁显示帮助信息
 */
const ExpressionHelpButton: React.FC<ExpressionHelpButtonProps> = ({ size = 'small', style }) => {
    return (
        <Popover
            content={<ExpressionHelpContent />}
            title="表达式语法帮助"
            trigger="click"
            placement="rightTop"
            overlayStyle={{ maxWidth: 600 }}
        >
            <Button
                type="text"
                size={size}
                icon={<QuestionCircleOutlined />}
                style={{ color: '#1890ff', ...style }}
            >
                语法帮助
            </Button>
        </Popover>
    );
};

export { ExpressionHelpButton, ExpressionHelpContent };
export default ExpressionHelpButton;

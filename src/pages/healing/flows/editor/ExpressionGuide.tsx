import React, { useState } from 'react';
import { Button, Table, Typography } from 'antd';
import { ReadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

// === 数据定义 ===
interface GuideData {
    key: string;
    cat?: string; // 类别
    syntax: string;
    desc: string;
    example: string;
}

// 上下文变量
const CONTEXT_DATA: GuideData[] = [
    { key: 'c1', syntax: 'incident', desc: '当前工单对象 (字典)', example: 'incident.title' },
    { key: 'c2', syntax: 'hosts', desc: '目标主机 (数组)', example: 'hosts[0]' },
    { key: 'c3', syntax: 'validated_hosts', desc: '验证后主机 (数组)', example: 'first(validated_hosts)' },
    { key: 'c4', syntax: 'execution_result', desc: '执行结果 (字典)', example: 'execution_result.status' },
];

// 综合函数列表 (分类显示)
const ALL_FUNCS: GuideData[] = [
    // 1. 数据访问
    { key: 'a1', cat: '数据访问', syntax: 'obj.field', desc: '访问对象/字典属性', example: 'incident.title' },
    { key: 'a2', cat: '数据访问', syntax: 'obj["key"]', desc: '访问动态键名', example: 'incident["raw_data"]' },
    { key: 'a3', cat: '数据访问', syntax: 'arr[i]', desc: '访问数组元素', example: 'hosts[0]' },
    { key: 'a4', cat: '数据访问', syntax: 'a.b.c', desc: '链式嵌套访问', example: 'incident.raw_data.id' },

    // 2. 数组操作
    { key: 'r1', cat: '数组操作', syntax: 'len(arr)', desc: '获取数组长度', example: 'len(hosts)' },
    { key: 'r2', cat: '数组操作', syntax: 'first(arr)', desc: '获取第一个元素', example: 'first(hosts)' },
    { key: 'r3', cat: '数组操作', syntax: 'last(arr)', desc: '获取最后一个元素', example: 'last(hosts)' },
    { key: 'r4', cat: '数组操作', syntax: 'join(arr, sep)', desc: '数组转字符串', example: 'join(hosts, ",")' },
    { key: 'r5', cat: '数组操作', syntax: 'pluck(arr, key)', desc: '提取对象数组字段', example: 'pluck(hosts, "ip")' },

    // 3. 字典/对象操作
    { key: 'd1', cat: '字典操作', syntax: 'len(obj)', desc: '获取键值对数量', example: 'len(incident)' },
    { key: 'd2', cat: '字典操作', syntax: 'obj.key', desc: '读取字典值', example: 'incident.severity' },

    // 4. 字符串操作
    { key: 's1', cat: '字符串', syntax: 'len(str)', desc: '获取字符串长度', example: 'len(msg)' },
    { key: 's2', cat: '字符串', syntax: 'upper(s) / lower(s)', desc: '转大写 / 转小写', example: 'upper(status)' },
    { key: 's3', cat: '字符串', syntax: 'trim(s)', desc: '去除首尾空格', example: 'trim(name)' },
    { key: 's4', cat: '字符串', syntax: 'split(s, sep)', desc: '分割为数组', example: 'split(ip, ".")' },
    { key: 's5', cat: '字符串', syntax: 'contains(s, sub)', desc: '包含子串判断', example: 'contains(msg, "err")' },
    { key: 's6', cat: '字符串', syntax: 'replace(s,o,n)', desc: '字符串替换', example: 'replace(s, "/", "-")' },

    // 5. 逻辑与数学
    { key: 'm1', cat: '逻辑数学', syntax: 'a ? b : c', desc: '三元条件判断', example: 'count>0 ? "有" : "无"' },
    { key: 'm2', cat: '逻辑数学', syntax: 'default(v, d)', desc: '空值默认值', example: 'default(val, 0)' },
    { key: 'm3', cat: '逻辑数学', syntax: 'toInt(v)', desc: '转整数', example: 'toInt("123")' },
    { key: 'm4', cat: '逻辑数学', syntax: 'toString(v)', desc: '转字符串', example: 'toString(123)' },
    { key: 'm5', cat: '逻辑数学', syntax: '+ - * / %', desc: '数学运算', example: 'count + 1' },
    { key: 'm6', cat: '逻辑数学', syntax: '&& || !', desc: '逻辑运算', example: 'a && !b' },
];

// === 样式 ===
const CODE_STYLE: React.CSSProperties = {
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: 11, // 更小字体
    color: '#000000e0',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    padding: '0 3px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    borderRadius: 2,
    wordBreak: 'break-all',
    whiteSpace: 'pre-wrap',
};

const TEXT_STYLE: React.CSSProperties = {
    fontSize: 12, // 更小字体
    color: '#333',
};

// === 列定义 ===
const columns: ColumnsType<GuideData> = [
    {
        title: '分类',
        dataIndex: 'cat',
        width: 80,
        onCell: (record, index) => {
            // 简单的行合并逻辑
            if (index === undefined) return {};
            // 注意：这里仅作简单的展示，如果不需要合并行可以去掉 onCell
            // 为了简单稳健，暂时不合并，或者通过 sorting 排序后合并
            // 这里为了紧凑，我们只显示 Syntax, Desc, Example，"Category" 可以作为 Group Header 或者第一列
            return {};
        },
        render: (text) => <span style={{ fontWeight: 600, fontSize: 11, color: '#666' }}>{text}</span>
    },
    {
        title: '语法',
        dataIndex: 'syntax',
        width: 140,
        render: (text) => <span style={{ ...CODE_STYLE, color: '#1677ff' }}>{text}</span>,
    },
    {
        title: '说明',
        dataIndex: 'desc',
        render: (text) => <span style={TEXT_STYLE}>{text}</span>,
    },
    {
        title: '示例',
        dataIndex: 'example',
        width: 160,
        render: (text) => <span style={{ ...CODE_STYLE, color: '#389e0d' }}>{text}</span>,
    },
];

// 只有3列的精简版 (Category 合并在表格中)
const compactColumns: ColumnsType<GuideData> = [
    {
        title: '语法',
        dataIndex: 'syntax',
        width: 130,
        render: (text) => <span style={{ ...CODE_STYLE, color: '#1677ff' }}>{text}</span>,
    },
    {
        title: '说明',
        dataIndex: 'desc',
        render: (text, record) => (
            <div>
                {/* 如果是新分类的每一项，或者可以把分类加在说明前 */}
                {/* 为了极度紧凑，我们直接显示说明 */}
                <span style={TEXT_STYLE}>{text}</span>
                {/* 可以在这里显示分类标签，或者就纯平铺 */}
            </div>
        ),
    },
    {
        title: '示例',
        dataIndex: 'example',
        width: 150,
        render: (text) => <span style={{ ...CODE_STYLE, color: '#389e0d' }}>{text}</span>,
    },
];

export const ExpressionGuideContent: React.FC = () => (
    <div style={{ padding: '0' }}>

        {/* 上下文部分 */}
        <div style={{ marginBottom: 16 }}>
            <Table
                columns={compactColumns}
                dataSource={CONTEXT_DATA}
                pagination={false}
                size="small"
                bordered
                rowKey="key"
                title={() => <span style={{ fontSize: 12, fontWeight: 'bold' }}>📦 上下文变量 (Context)</span>}
                scroll={{ x: 'max-content' }}
                style={{ fontSize: 11 }}
            />
        </div>

        {/* 综合函数部分 - 按照分类渲染多个小表格，或者一个大表格 */}
        {/* 用户想要 "全"，我们就用一个大表格按照分类排序展示，或者分组 */}

        {[
            { title: '🔹 数据访问 & 字典操作', data: ALL_FUNCS.filter(i => i.cat?.includes('数据') || i.cat?.includes('字典')) },
            { title: '📚 数组操作 (Array)', data: ALL_FUNCS.filter(i => i.cat?.includes('数组')) },
            { title: '📝 字符串操作 (String)', data: ALL_FUNCS.filter(i => i.cat?.includes('字符串')) },
            { title: '🔢 逻辑与运算', data: ALL_FUNCS.filter(i => i.cat?.includes('逻辑')) },
        ].map((group) => (
            <div key={group.title} style={{ marginBottom: 16 }}>
                <Table
                    columns={compactColumns}
                    dataSource={group.data}
                    pagination={false}
                    size="small"
                    bordered
                    rowKey="key"
                    title={() => <span style={{ fontSize: 12, fontWeight: 'bold' }}>{group.title}</span>}
                    scroll={{ x: 'max-content' }}
                    style={{ fontSize: 11 }}
                />
            </div>
        ))}

        <div style={{ fontSize: 11, color: '#999', marginTop: 8 }}>
            <InfoCircleOutlined style={{ marginRight: 4 }} />
            <span>数组函数仅支持数组类型输入。对象操作请使用 <code>obj.field</code> 或 <code>len(obj)</code>。</span>
        </div>
    </div>
);

interface ExpressionGuideProps {
    buttonText?: string;
    defaultOpen?: boolean;
}

const ExpressionGuide: React.FC<ExpressionGuideProps> = ({
    buttonText = '查看表达式语法指南',
    defaultOpen = false
}) => {
    const [showGuide, setShowGuide] = useState(defaultOpen);

    return (
        <div style={{ marginBottom: 12 }}>
            <Button
                size="middle"
                type={showGuide ? 'primary' : 'default'}
                icon={<ReadOutlined />}
                onClick={() => setShowGuide(!showGuide)}
                style={{ width: '100%', textAlign: 'left', borderRadius: 2 }}
            >
                {showGuide ? '收起指南' : buttonText}
            </Button>

            {showGuide && (
                <div style={{
                    marginTop: 8,
                    // 不使用 padding，让表格贴边，更紧凑
                    // 也不使用 Collapse，直接平铺
                    border: '1px solid #f0f0f0',
                    borderRadius: 2,
                    background: '#fff',
                }}>
                    <ExpressionGuideContent />
                </div>
            )}
        </div>
    );
};

export default ExpressionGuide;

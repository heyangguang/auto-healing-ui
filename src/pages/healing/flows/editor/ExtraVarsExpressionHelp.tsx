import React from 'react';
import { Button, Divider, Popover, Typography } from 'antd';
import { FunctionOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

type ContextSuggestion = {
    value: string;
    label: string;
};

type ExpressionHelpSection = {
    title: string;
    items: Array<{
        syntax: string;
        desc: string;
    }>;
};

const CONTEXT_SUGGESTIONS: ContextSuggestion[] = [
    { value: 'incident.id', label: '告警ID' },
    { value: 'incident.title', label: '告警标题' },
    { value: 'incident.description', label: '告警描述' },
    { value: 'incident.severity', label: '告警级别 (1-5)' },
    { value: 'incident.status', label: '告警状态' },
    { value: 'incident.source', label: '告警来源' },
    { value: 'incident.affected_ci', label: '受影响资产' },
    { value: 'incident.affected_service', label: '受影响服务' },
    { value: 'incident.created_at', label: '告警创建时间' },
    { value: 'incident.raw_data', label: '告警原始数据 (完整对象)' },
    { value: 'incident.raw_data.xxx', label: '告警原始数据中的字段 (自定义)' },
    { value: 'hosts', label: '提取的原始主机列表' },
    { value: 'validated_hosts', label: '验证通过的主机列表' },
    { value: 'validated_hosts[0]', label: '第一台验证主机 (对象)' },
    { value: 'validated_hosts[0].ip_address', label: '第一台主机IP' },
    { value: 'validated_hosts[0].hostname', label: '第一台主机名' },
    { value: 'validated_hosts[0].os_type', label: '第一台主机操作系统' },
    { value: 'validated_hosts[-1].ip_address', label: '最后一台主机IP' },
    { value: 'execution_result', label: '执行结果 (完整对象)' },
    { value: 'execution_result.status', label: '执行状态' },
    { value: 'execution_result.stdout', label: '标准输出' },
    { value: 'execution_result.stderr', label: '错误输出' },
    { value: 'execution_result.rc', label: '返回码' },
    { value: 'execution_result.stats', label: '执行统计' },
    { value: 'execution_result.stats.ok', label: '成功主机数' },
    { value: 'execution_result.stats.failed', label: '失败主机数' },
    { value: 'len(validated_hosts)', label: '主机数量' },
    { value: 'first(validated_hosts)', label: '第一个主机 (对象)' },
    { value: 'first(validated_hosts).ip_address', label: '第一台主机IP (函数)' },
    { value: 'last(validated_hosts)', label: '最后一个主机 (对象)' },
    { value: 'last(validated_hosts).ip_address', label: '最后一台主机IP' },
    { value: 'join(validated_hosts, ",")', label: '主机列表用逗号连接' },
    { value: 'join(validated_hosts, " ")', label: '主机列表用空格连接' },
    { value: 'join(validated_hosts, "\\n")', label: '主机列表用换行连接' },
    { value: 'pluck(validated_hosts, "ip_address")', label: '提取所有主机的IP列表' },
    { value: 'pluck(validated_hosts, "hostname")', label: '提取所有主机的主机名列表' },
    { value: 'join(pluck(validated_hosts, "ip_address"), ",")', label: '所有IP用逗号连接' },
    { value: 'upper(incident.title)', label: '告警标题转大写' },
    { value: 'lower(incident.title)', label: '告警标题转小写' },
    { value: 'trim(incident.description)', label: '去除描述首尾空白' },
    { value: 'replace(incident.title, "告警", "警报")', label: '替换标题中的文字' },
    { value: 'split(incident.affected_ci, ",")', label: '按逗号分割资产列表' },
    { value: 'incident.title contains "紧急"', label: '标题是否包含"紧急"' },
    { value: 'toInt(incident.severity)', label: '告警级别转整数' },
    { value: 'toString(len(validated_hosts))', label: '主机数量转字符串' },
    { value: 'default(incident.description, "无描述")', label: '描述为空时使用默认值' },
    { value: 'default(validated_hosts[0].ip_address, "unknown")', label: 'IP为空时使用默认值' },
    { value: 'incident.severity > 3 ? "高优先级" : "普通"', label: '根据级别判断优先级' },
    { value: 'len(validated_hosts) > 0 ? "有主机" : "无主机"', label: '判断是否有验证主机' },
    { value: 'execution_result.status == "success" ? "成功" : "失败"', label: '根据执行结果判断' },
    { value: '"告警: " + incident.title', label: '字符串拼接示例' },
    { value: 'first(validated_hosts).ip_address + ":22"', label: '主机IP加端口' },
    { value: '"共" + toString(len(validated_hosts)) + "台主机"', label: '动态生成描述' },
    { value: 'incident.title + " [" + incident.severity + "级]"', label: '告警标题带级别' },
];

const EXPRESSION_HELP_SECTIONS: ExpressionHelpSection[] = [
    {
        title: '📋 上下文字段',
        items: [
            { syntax: 'incident.title', desc: '告警标题' },
            { syntax: 'incident.severity', desc: '告警级别 (1-5)' },
            { syntax: 'incident.affected_ci', desc: '受影响的配置项' },
            { syntax: 'incident.raw_data.xxx', desc: '告警原始数据中的字段' },
            { syntax: 'validated_hosts', desc: '经 CMDB 验证的主机列表' },
            { syntax: 'validated_hosts[0].ip_address', desc: '第一台主机的 IP' },
            { syntax: 'validated_hosts[0].hostname', desc: '第一台主机名' },
            { syntax: 'execution_result.status', desc: '执行结果状态' },
        ],
    },
    {
        title: '🔧 基本操作',
        items: [
            { syntax: 'a + b, a - b, a * b, a / b', desc: '数学运算' },
            { syntax: 'a > b, a < b, a >= b, a <= b', desc: '比较运算' },
            { syntax: 'a == b, a != b', desc: '相等判断' },
            { syntax: 'a && b, a || b, !a', desc: '逻辑运算' },
            { syntax: 'a > b ? x : y', desc: '条件表达式（三元运算符）' },
            { syntax: 'arr[0], arr[-1]', desc: '数组索引（支持负数）' },
            { syntax: 'obj.field', desc: '对象属性访问' },
        ],
    },
    {
        title: '📚 数组函数',
        items: [
            { syntax: 'len(arr)', desc: '数组长度' },
            { syntax: 'first(arr)', desc: '第一个元素' },
            { syntax: 'last(arr)', desc: '最后一个元素' },
            { syntax: 'join(arr, ",")', desc: '用分隔符连接成字符串' },
            { syntax: 'pluck(arr, "field")', desc: '提取数组中每个对象的指定字段' },
        ],
    },
    {
        title: '📝 字符串函数',
        items: [
            { syntax: 'upper(s)', desc: '转大写' },
            { syntax: 'lower(s)', desc: '转小写' },
            { syntax: 'trim(s)', desc: '去除首尾空白' },
            { syntax: 'replace(s, "old", "new")', desc: '替换字符串' },
            { syntax: 'split(s, ",")', desc: '分割字符串为数组' },
            { syntax: 's contains "sub"', desc: '是否包含子串（中缀语法）' },
            { syntax: 'strContains(s, "sub")', desc: '是否包含子串（函数语法）' },
            { syntax: 'hasPrefix(s, "prefix")', desc: '是否以 prefix 开头' },
            { syntax: 'hasSuffix(s, "suffix")', desc: '是否以 suffix 结尾' },
        ],
    },
    {
        title: '🔢 数学函数',
        items: [
            { syntax: 'abs(n)', desc: '绝对值' },
            { syntax: 'max(a, b)', desc: '最大值' },
            { syntax: 'min(a, b)', desc: '最小值' },
            { syntax: 'toInt(v)', desc: '转为整数' },
            { syntax: 'toFloat(v)', desc: '转为浮点数' },
        ],
    },
    {
        title: '⚙️ 其他函数',
        items: [
            { syntax: 'default(val, fallback)', desc: '如果 val 为空则返回 fallback' },
            { syntax: 'toString(v)', desc: '转为字符串' },
        ],
    },
];

const HELP_EXAMPLE = 'len(validated_hosts) > 0 ? join(pluck(validated_hosts, "ip_address"), ",") : "无主机"';

export const EXTRA_VARS_EXPRESSION_OPTIONS = CONTEXT_SUGGESTIONS.map((suggestion) => ({
    value: suggestion.value,
    label: (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <code style={{ color: '#1890ff' }}>{suggestion.value}</code>
            <span style={{ color: '#8c8c8c', fontSize: 12 }}>{suggestion.label}</span>
        </div>
    ),
}));

export const filterExpressionOption = (input: string, option?: { value?: string }) => (
    option?.value?.toLowerCase().includes(input.toLowerCase()) || false
);

const ExtraVarsExpressionHelpButton: React.FC = () => (
    <Popover
        title={<><FunctionOutlined /> 表达式语法帮助</>}
        trigger="click"
        placement="rightTop"
        overlayStyle={{ maxWidth: 420 }}
        content={(
            <div style={{ maxHeight: 400, overflow: 'auto' }}>
                {EXPRESSION_HELP_SECTIONS.map((section) => (
                    <div key={section.title} style={{ marginBottom: 12 }}>
                        <Text strong style={{ fontSize: 13 }}>{section.title}</Text>
                        <div style={{ marginTop: 4 }}>
                            {section.items.map((item) => (
                                <div
                                    key={`${section.title}-${item.syntax}`}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: '2px 0',
                                        borderBottom: '1px dashed #f0f0f0',
                                    }}
                                >
                                    <code style={{ color: '#1890ff', fontSize: 12 }}>{item.syntax}</code>
                                    <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                                        {item.desc}
                                    </Text>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                <Divider style={{ margin: '8px 0' }} />
                <Text type="secondary" style={{ fontSize: 11 }}>
                    💡 表达式支持从上下文取值、进行计算、调用函数。可以组合使用，如：
                    <br />
                    <code style={{ color: '#52c41a' }}>{HELP_EXAMPLE}</code>
                </Text>
            </div>
        )}
    >
        <Button type="text" icon={<QuestionCircleOutlined />} style={{ color: '#1890ff' }} />
    </Popover>
);

export default ExtraVarsExpressionHelpButton;

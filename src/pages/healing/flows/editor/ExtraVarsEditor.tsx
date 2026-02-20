import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Modal, Form, Input, InputNumber, Select, Switch, Typography, Empty, Spin, Tag, Button, Space, Tooltip, AutoComplete, Segmented, Popover, Collapse, Divider } from 'antd';
import { SettingOutlined, InfoCircleOutlined, CheckOutlined, ExclamationCircleOutlined, SwapRightOutlined, FunctionOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { getExecutionTask } from '@/services/auto-healing/execution';
import { getPlaybook } from '@/services/auto-healing/playbooks';

const { Text } = Typography;

interface PlaybookVariable {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'choice' | 'list' | 'enum' | 'password' | 'object';
    required?: boolean;
    description?: string;
    default?: any;
    options?: string[];
    enum?: string[];
}

interface ExtraVarsEditorProps {
    taskTemplateId?: string;
    value?: Record<string, any>;
    variableMappings?: Record<string, string>;  // 变量映射
    onChange?: (vars: Record<string, any>) => void;
    onMappingsChange?: (mappings: Record<string, string>) => void;
    onBatchChange?: (vars: Record<string, any>, mappings: Record<string, string>) => void; // 原子更新回调
}

export interface ExtraVarsEditorRef {
    validateRequiredVars: () => { valid: boolean; missing: string[] };
    getRequiredVarNames: () => string[];
}

// 上下文字段建议 - 按类别分组，带中文说明，尽可能覆盖常见场景
const CONTEXT_SUGGESTIONS = [
    // ========== 告警信息 ==========
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

    // ========== 主机信息 ==========
    { value: 'hosts', label: '提取的原始主机列表' },
    { value: 'validated_hosts', label: '验证通过的主机列表' },
    { value: 'validated_hosts[0]', label: '第一台验证主机 (对象)' },
    { value: 'validated_hosts[0].ip_address', label: '第一台主机IP' },
    { value: 'validated_hosts[0].hostname', label: '第一台主机名' },
    { value: 'validated_hosts[0].os_type', label: '第一台主机操作系统' },
    { value: 'validated_hosts[-1].ip_address', label: '最后一台主机IP' },

    // ========== 执行结果 ==========
    { value: 'execution_result', label: '执行结果 (完整对象)' },
    { value: 'execution_result.status', label: '执行状态' },
    { value: 'execution_result.stdout', label: '标准输出' },
    { value: 'execution_result.stderr', label: '错误输出' },
    { value: 'execution_result.rc', label: '返回码' },
    { value: 'execution_result.stats', label: '执行统计' },
    { value: 'execution_result.stats.ok', label: '成功主机数' },
    { value: 'execution_result.stats.failed', label: '失败主机数' },

    // ========== 数组操作函数 ==========
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

    // ========== 字符串操作 ==========
    { value: 'upper(incident.title)', label: '告警标题转大写' },
    { value: 'lower(incident.title)', label: '告警标题转小写' },
    { value: 'trim(incident.description)', label: '去除描述首尾空白' },
    { value: 'replace(incident.title, "告警", "警报")', label: '替换标题中的文字' },
    { value: 'split(incident.affected_ci, ",")', label: '按逗号分割资产列表' },
    { value: 'incident.title contains "紧急"', label: '标题是否包含"紧急"' },

    // ========== 数学和类型转换 ==========
    { value: 'toInt(incident.severity)', label: '告警级别转整数' },
    { value: 'toString(len(validated_hosts))', label: '主机数量转字符串' },
    { value: 'default(incident.description, "无描述")', label: '描述为空时使用默认值' },
    { value: 'default(validated_hosts[0].ip_address, "unknown")', label: 'IP为空时使用默认值' },

    // ========== 条件表达式 ==========
    { value: 'incident.severity > 3 ? "高优先级" : "普通"', label: '根据级别判断优先级' },
    { value: 'len(validated_hosts) > 0 ? "有主机" : "无主机"', label: '判断是否有验证主机' },
    { value: 'execution_result.status == "success" ? "成功" : "失败"', label: '根据执行结果判断' },

    // ========== 复合表达式示例 ==========
    { value: '"告警: " + incident.title', label: '字符串拼接示例' },
    { value: 'first(validated_hosts).ip_address + ":22"', label: '主机IP加端口' },
    { value: '"共" + toString(len(validated_hosts)) + "台主机"', label: '动态生成描述' },
    { value: 'incident.title + " [" + incident.severity + "级]"', label: '告警标题带级别' },
];

// 表达式语法帮助 - 完整的语法说明
const EXPRESSION_HELP = {
    contextFields: {
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
        ]
    },
    basicOps: {
        title: '🔧 基本操作',
        items: [
            { syntax: 'a + b, a - b, a * b, a / b', desc: '数学运算' },
            { syntax: 'a > b, a < b, a >= b, a <= b', desc: '比较运算' },
            { syntax: 'a == b, a != b', desc: '相等判断' },
            { syntax: 'a && b, a || b, !a', desc: '逻辑运算' },
            { syntax: 'a > b ? x : y', desc: '条件表达式（三元运算符）' },
            { syntax: 'arr[0], arr[-1]', desc: '数组索引（支持负数）' },
            { syntax: 'obj.field', desc: '对象属性访问' },
        ]
    },
    arrayFuncs: {
        title: '📚 数组函数',
        items: [
            { syntax: 'len(arr)', desc: '数组长度' },
            { syntax: 'first(arr)', desc: '第一个元素' },
            { syntax: 'last(arr)', desc: '最后一个元素' },
            { syntax: 'join(arr, ",")', desc: '用分隔符连接成字符串' },
            { syntax: 'pluck(arr, "field")', desc: '提取数组中每个对象的指定字段' },
        ]
    },
    stringFuncs: {
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
        ]
    },
    mathFuncs: {
        title: '🔢 数学函数',
        items: [
            { syntax: 'abs(n)', desc: '绝对值' },
            { syntax: 'max(a, b)', desc: '最大值' },
            { syntax: 'min(a, b)', desc: '最小值' },
            { syntax: 'toInt(v)', desc: '转为整数' },
            { syntax: 'toFloat(v)', desc: '转为浮点数' },
        ]
    },
    otherFuncs: {
        title: '⚙️ 其他函数',
        items: [
            { syntax: 'default(val, fallback)', desc: '如果 val 为空则返回 fallback' },
            { syntax: 'toString(v)', desc: '转为字符串' },
        ]
    },
};

const ExtraVarsEditor = forwardRef<ExtraVarsEditorRef, ExtraVarsEditorProps>(({
    taskTemplateId,
    value = {},
    variableMappings = {},
    onChange,
    onMappingsChange,
    onBatchChange
}, ref) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [variables, setVariables] = useState<PlaybookVariable[]>([]);
    const [defaultVars, setDefaultVars] = useState<Record<string, any>>({});
    const [requiredForm] = Form.useForm();
    // 跟踪每个变量的输入模式：'static' 或 'expression'
    const [varModes, setVarModes] = useState<Record<string, 'static' | 'expression'>>({});
    // Modal 内的临时表达式映射（只在 Modal 内使用，确定时才提交）
    const [modalMappings, setModalMappings] = useState<Record<string, string>>({});
    // Modal 内的临时静态值（只在 Modal 内使用，确定时才提交）
    const [modalStaticValues, setModalStaticValues] = useState<Record<string, any>>({});

    // 分离必填和可选变量
    const requiredVars = useMemo(() => variables.filter(v => v.required), [variables]);
    const optionalVars = useMemo(() => variables.filter(v => !v.required), [variables]);

    // 获取可选变量中已配置的
    const configuredOptionalVars = useMemo(() => {
        return optionalVars.filter(v => {
            const val = value[v.name];
            const mapping = variableMappings[v.name];
            return (val !== undefined && val !== '' && val !== null) || mapping;
        });
    }, [optionalVars, value, variableMappings]);

    // 加载任务模板和Playbook的变量定义
    const loadVariables = async (notifyParent: boolean = false) => {
        if (!taskTemplateId) return;

        setLoading(true);
        try {
            const taskRes = await getExecutionTask(taskTemplateId);
            const task = taskRes.data;

            const extraVars = task?.extra_vars || {};
            setDefaultVars(extraVars);

            if (task?.playbook?.id) {
                const playbookRes = await getPlaybook(task.playbook.id);
                const playbook = playbookRes.data;
                setVariables(playbook?.variables || []);
            } else {
                const inferredVars = Object.keys(extraVars).map(key => ({
                    name: key,
                    type: 'string' as const,
                    default: extraVars[key]
                }));
                setVariables(inferredVars);
            }

            // 初始化变量模式：如果已有 mapping 则设为 expression
            const modes: Record<string, 'static' | 'expression'> = {};
            Object.keys(variableMappings).forEach(k => {
                if (variableMappings[k]) modes[k] = 'expression';
            });
            setVarModes(modes);

            if (notifyParent) {
                onChange?.(extraVars);
            }
        } catch (error) {
            console.error('Failed to load variables:', error);
        } finally {
            setLoading(false);
        }
    };

    const prevTaskTemplateIdRef = React.useRef<string | undefined>(undefined);

    useEffect(() => {
        if (taskTemplateId) {
            const isNewTemplate = prevTaskTemplateIdRef.current !== undefined &&
                prevTaskTemplateIdRef.current !== taskTemplateId;
            loadVariables(isNewTemplate);
            prevTaskTemplateIdRef.current = taskTemplateId;
        } else {
            setVariables([]);
            setDefaultVars({});
            prevTaskTemplateIdRef.current = undefined;
        }
    }, [taskTemplateId]);

    useEffect(() => {
        if (requiredVars.length > 0) {
            const requiredValues: Record<string, any> = {};
            requiredVars.forEach(v => {
                requiredValues[v.name] = value[v.name] ?? defaultVars[v.name];
            });
            requiredForm.setFieldsValue(requiredValues);
        }
    }, [requiredVars, value, defaultVars]);

    // 根据 variableMappings 自动设置 varModes
    useEffect(() => {
        if (variableMappings && Object.keys(variableMappings).length > 0) {
            const modes: Record<string, 'static' | 'expression'> = { ...varModes };
            Object.keys(variableMappings).forEach(varName => {
                if (variableMappings[varName]) {
                    modes[varName] = 'expression';
                }
            });
            setVarModes(modes);
        }
    }, [variableMappings]);

    useImperativeHandle(ref, () => ({
        validateRequiredVars: () => {
            const missing: string[] = [];
            requiredVars.forEach(v => {
                const val = value[v.name];
                const mapping = variableMappings[v.name];
                // 有静态值或有表达式映射都算满足
                if ((val === undefined || val === '' || val === null) && !mapping) {
                    missing.push(v.name);
                }
            });
            return { valid: missing.length === 0, missing };
        },
        getRequiredVarNames: () => requiredVars.map(v => v.name)
    }));

    // 切换变量输入模式
    const handleModeChange = (varName: string, mode: 'static' | 'expression') => {
        setVarModes(prev => ({ ...prev, [varName]: mode }));
        if (mode === 'static') {
            // 切换到静态时，清除映射
            const newMappings = { ...variableMappings };
            delete newMappings[varName];
            onMappingsChange?.(newMappings);
        } else {
            // 切换到表达式时，清除静态值
            const newValue = { ...value };
            delete newValue[varName];
            onChange?.(newValue);
        }
    };

    // 表达式变化
    const handleExpressionChange = (varName: string, expr: string) => {
        const newMappings = { ...variableMappings, [varName]: expr };
        if (!expr) delete newMappings[varName];
        onMappingsChange?.(newMappings);
    };

    // 必填变量值变化
    const handleRequiredChange = (_: any, allValues: any) => {
        const newValue = { ...value, ...allValues };
        const filteredValue = Object.fromEntries(
            Object.entries(newValue).filter(([_, v]) => v !== undefined && v !== '' && v !== null)
        );
        onChange?.(filteredValue);
    };

    const handleOpenModal = () => {
        // 初始化静态值（拷贝现有值到本地状态）
        const staticValuesCopy: Record<string, any> = {};
        optionalVars.forEach(v => {
            staticValuesCopy[v.name] = value[v.name] ?? defaultVars[v.name];
        });
        setModalStaticValues(staticValuesCopy);

        // 初始化 Modal 内的表达式映射（拷贝现有的 variableMappings）
        const modalMappingsCopy: Record<string, string> = {};
        const modesCopy: Record<string, 'static' | 'expression'> = { ...varModes };
        optionalVars.forEach(v => {
            if (variableMappings[v.name]) {
                modalMappingsCopy[v.name] = variableMappings[v.name];
                modesCopy[v.name] = 'expression';  // 有表达式映射，设置为表达式模式
            }
        });
        setModalMappings(modalMappingsCopy);
        setVarModes(modesCopy);

        setModalOpen(true);
    };

    // Modal 内表达式变化（使用本地状态，只在确定时才提交）
    const handleModalExpressionChange = (varName: string, expr: string) => {
        const newMappings = { ...modalMappings, [varName]: expr };
        if (!expr) delete newMappings[varName];
        setModalMappings(newMappings);
    };

    // Modal 内静态值变化
    const handleModalStaticChange = (varName: string, val: any) => {
        setModalStaticValues(prev => ({ ...prev, [varName]: val }));
    };

    // Modal 内模式切换（只更新 varModes，不调用父组件回调）
    const handleModalModeChange = (varName: string, mode: 'static' | 'expression') => {
        setVarModes(prev => ({ ...prev, [varName]: mode }));
        if (mode === 'static') {
            // 切换到静态时，清除本地映射
            const newMappings = { ...modalMappings };
            delete newMappings[varName];
            setModalMappings(newMappings);
        }
    };

    const handleConfirm = () => {
        // 保存静态值（必填变量的静态值 + Modal 内选择的可选变量静态值）
        const requiredValues: Record<string, any> = {};
        requiredVars.forEach(v => {
            if (value[v.name] !== undefined) {
                requiredValues[v.name] = value[v.name];
            }
        });

        // 只保存静态模式的可选变量值
        const optionalStaticValues: Record<string, any> = {};
        optionalVars.forEach(v => {
            const mode = varModes[v.name] || 'static';
            if (mode === 'static' && modalStaticValues[v.name] !== undefined && modalStaticValues[v.name] !== '' && modalStaticValues[v.name] !== null) {
                optionalStaticValues[v.name] = modalStaticValues[v.name];
            }
        });

        const newValue = { ...requiredValues, ...optionalStaticValues };

        // 合并必填变量的表达式映射和 Modal 内的可选变量表达式映射
        const newMappings = { ...variableMappings };
        // 保留必填变量的映射（这里其实只要拷贝 variableMappings 就够了，因为 modalMappings 是从它初始化的）
        // 但为了安全起见，我们重新构建
        requiredVars.forEach(v => {
            if (variableMappings[v.name]) {
                newMappings[v.name] = variableMappings[v.name];
            }
        });
        // 更新可选变量的映射
        optionalVars.forEach(v => {
            if (modalMappings[v.name]) {
                newMappings[v.name] = modalMappings[v.name];
            } else {
                delete newMappings[v.name];
            }
        });

        if (onBatchChange) {
            console.log('Using Batch Change:', { newValue, newMappings });
            onBatchChange(newValue, newMappings);
        } else {
            console.warn('onBatchChange NOT available, using individual updates');
            onChange?.(newValue);
            onMappingsChange?.(newMappings);
        }

        setModalOpen(false);
    };

    // 渲染单个变量行（支持静态值和表达式切换）
    const renderVariableRow = (
        variable: PlaybookVariable,
        isRequired: boolean,
        form: typeof requiredForm | null,  // 必填变量用 Form，可选变量传 null
        onValuesChange: ((changedValues: any, allValues: any) => void) | null,
        staticValue: any,  // 当前静态值（可选变量用本地状态）
        onStaticChange: ((varName: string, val: any) => void) | null,  // 直接静态值变化回调
        expressionMappings: Record<string, string>,
        onExpressionChange: (varName: string, expr: string) => void,
        onModeChange: (varName: string, mode: 'static' | 'expression') => void
    ) => {
        const { name, type, description } = variable;
        const mode = varModes[name] || 'static';
        // 格式化 AutoComplete 选项
        const expressionOptions = CONTEXT_SUGGESTIONS.map(s => ({
            value: s.value,
            label: `${s.value} - ${s.label}`
        }));

        return (
            <div
                key={name}
                style={{
                    padding: '12px',
                    marginBottom: 8,
                    background: isRequired ? '#fffbf0' : '#fafafa',
                    border: isRequired ? '1px dashed #ff4d4f' : '1px solid #f0f0f0',
                    borderRadius: 4,
                }}
            >
                {/* 第一行：变量名 + 切换按钮 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Text strong style={{ fontSize: 13 }}>{name}</Text>
                        {isRequired && <Text type="danger">*</Text>}
                        {description && (
                            <Tooltip title={description}>
                                <InfoCircleOutlined style={{ color: '#999', fontSize: 12 }} />
                            </Tooltip>
                        )}
                    </div>
                    <Segmented
                        size="small"
                        options={[
                            { label: '静态值', value: 'static' },
                            { label: <><FunctionOutlined /> 表达式</>, value: 'expression' }
                        ]}
                        value={mode}
                        onChange={(v) => onModeChange(name, v as 'static' | 'expression')}
                    />
                </div>

                {/* 第二行：输入框 - 全宽标准大小 */}
                {mode === 'static' ? (
                    form && onValuesChange ? (
                        // 必填变量：使用 Form 管理
                        <Form form={form} layout="vertical" onValuesChange={onValuesChange}>
                            <Form.Item name={name} style={{ margin: 0 }}>
                                {type === 'number' ? (
                                    <InputNumber style={{ width: '100%' }} placeholder={`请输入 ${name}`} />
                                ) : type === 'boolean' ? (
                                    <Switch checkedChildren="是" unCheckedChildren="否" />
                                ) : type === 'choice' && variable.options ? (
                                    <Select placeholder={`请选择 ${name}`} allowClear style={{ width: '100%' }}>
                                        {variable.options.map(opt => (
                                            <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                                        ))}
                                    </Select>
                                ) : (
                                    <Input placeholder={`请输入 ${name}`} />
                                )}
                            </Form.Item>
                        </Form>
                    ) : (
                        // 可选变量：直接值传递
                        type === 'number' ? (
                            <InputNumber
                                style={{ width: '100%' }}
                                placeholder={`请输入 ${name}`}
                                value={staticValue}
                                onChange={(val) => onStaticChange?.(name, val)}
                            />
                        ) : type === 'boolean' ? (
                            <Switch
                                checkedChildren="是"
                                unCheckedChildren="否"
                                checked={staticValue}
                                onChange={(val) => onStaticChange?.(name, val)}
                            />
                        ) : type === 'choice' && variable.options ? (
                            <Select
                                placeholder={`请选择 ${name}`}
                                allowClear
                                style={{ width: '100%' }}
                                value={staticValue}
                                onChange={(val) => onStaticChange?.(name, val)}
                            >
                                {variable.options.map(opt => (
                                    <Select.Option key={opt} value={opt}>{opt}</Select.Option>
                                ))}
                            </Select>
                        ) : (
                            <Input
                                placeholder={`请输入 ${name}`}
                                value={staticValue || ''}
                                onChange={(e) => onStaticChange?.(name, e.target.value)}
                            />
                        )
                    )
                ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                        <AutoComplete
                            placeholder="选择常用表达式或直接输入"
                            value={expressionMappings[name] || ''}
                            onChange={(val) => onExpressionChange(name, val || '')}
                            style={{ flex: 1 }}
                            allowClear
                            options={CONTEXT_SUGGESTIONS.map(s => ({
                                value: s.value,
                                label: (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <code style={{ color: '#1890ff' }}>{s.value}</code>
                                        <span style={{ color: '#8c8c8c', fontSize: 12 }}>{s.label}</span>
                                    </div>
                                )
                            }))}
                            filterOption={(input, option) =>
                                (option?.value as string)?.toLowerCase().includes(input.toLowerCase()) || false
                            }
                        />
                        <Popover
                            title={<><FunctionOutlined /> 表达式语法帮助</>}
                            trigger="click"
                            placement="rightTop"
                            overlayStyle={{ maxWidth: 420 }}
                            content={
                                <div style={{ maxHeight: 400, overflow: 'auto' }}>
                                    {Object.values(EXPRESSION_HELP).map((section, idx) => (
                                        <div key={idx} style={{ marginBottom: 12 }}>
                                            <Text strong style={{ fontSize: 13 }}>{section.title}</Text>
                                            <div style={{ marginTop: 4 }}>
                                                {section.items.map((item, i) => (
                                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px dashed #f0f0f0' }}>
                                                        <code style={{ color: '#1890ff', fontSize: 12 }}>{item.syntax}</code>
                                                        <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>{item.desc}</Text>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <Divider style={{ margin: '8px 0' }} />
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                        💡 表达式支持从上下文取值、进行计算、调用函数。可以组合使用，如：<br />
                                        <code style={{ color: '#52c41a' }}>{'len(validated_hosts) > 0 ? join(pluck(validated_hosts, "ip_address"), ",") : "无主机"'}</code>
                                    </Text>
                                </div>
                            }
                        >
                            <Button type="text" icon={<QuestionCircleOutlined />} style={{ color: '#1890ff' }} />
                        </Popover>
                    </div>
                )}
            </div>
        );
    };

    if (!taskTemplateId) {
        return (
            <div style={{
                border: '1px solid #f0f0f0',
                borderRadius: 0,
                padding: '16px',
                textAlign: 'center',
                color: '#999'
            }}>
                <Text type="secondary">请先选择任务模板</Text>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{
                border: '1px solid #f0f0f0',
                borderRadius: 0,
                padding: '24px',
                textAlign: 'center'
            }}>
                <Spin size="small" />
            </div>
        );
    }

    if (variables.length === 0) {
        return (
            <div style={{
                border: '1px solid #f0f0f0',
                borderRadius: 0,
                padding: '16px',
                textAlign: 'center',
                color: '#999'
            }}>
                <Text type="secondary">该任务模板没有定义额外变量</Text>
            </div>
        );
    }

    return (
        <>
            {/* 必填变量区域 */}
            {requiredVars.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 12 }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>必填变量</Text>
                        <Text type="secondary" style={{ fontSize: 11, marginLeft: 'auto' }}>
                            可选择静态值或表达式
                        </Text>
                    </div>
                    {requiredVars.map(v => renderVariableRow(v, true, requiredForm, handleRequiredChange, undefined, null, variableMappings, handleExpressionChange, handleModeChange))}
                </div>
            )}

            {/* 可选变量区域 */}
            {optionalVars.length > 0 && (
                <div>
                    <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <SettingOutlined style={{ color: '#1890ff', fontSize: 12 }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>可选变量</Text>
                    </div>
                    <div style={{
                        border: '1px solid #f0f0f0',
                        borderRadius: 0,
                        padding: '12px',
                        background: configuredOptionalVars.length > 0 ? '#fafafa' : 'transparent'
                    }}>
                        {configuredOptionalVars.length > 0 ? (
                            <div>
                                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        <CheckOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                                        已配置 {configuredOptionalVars.length} 个可选变量
                                    </Text>
                                    <Button type="link" size="small" onClick={handleOpenModal}>
                                        编辑
                                    </Button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {configuredOptionalVars.map(v => {
                                        const mapping = variableMappings[v.name];
                                        return (
                                            <Tag key={v.name} style={{ fontSize: 11 }} color={mapping ? 'blue' : undefined}>
                                                {v.name}: {mapping ? `expr(${mapping})` : (typeof value[v.name] === 'object' ? JSON.stringify(value[v.name]) : String(value[v.name]))}
                                            </Tag>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>未配置可选变量</Text>
                                <br />
                                <Button
                                    type="link"
                                    icon={<SettingOutlined />}
                                    onClick={handleOpenModal}
                                >
                                    配置变量
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 可选变量编辑弹窗 */}
            <Modal
                title={<Space><SettingOutlined />配置可选变量</Space>}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                onOk={handleConfirm}
                okText="确定"
                cancelText="取消"
                width={600}
                destroyOnHidden
            >
                {optionalVars.length === 0 ? (
                    <Empty description="该任务模板没有可选变量" />
                ) : (
                    <div style={{ maxHeight: 400, overflow: 'auto' }}>
                        {optionalVars.map(v => renderVariableRow(v, false, null, null, modalStaticValues[v.name], handleModalStaticChange, modalMappings, handleModalExpressionChange, handleModalModeChange))}
                    </div>
                )}
            </Modal>
        </>
    );
});

export default ExtraVarsEditor;

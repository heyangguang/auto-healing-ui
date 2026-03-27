import React, { useState } from 'react';
import { Button, Empty, Modal, Space, Tag, Typography } from 'antd';
import { CheckOutlined, SettingOutlined } from '@ant-design/icons';
import ExtraVarsVariableRow from './ExtraVarsVariableRow';
import type {
    ExtraVarsMappings,
    ExtraVarsValueMap,
    ExtraVarsVariable,
    VariableInputMode,
    VariableModeMap,
    VariableModesSetter,
} from './extraVarsTypes';
import { hasConfiguredValue } from './extraVarsTypes';

const { Text } = Typography;

interface ExtraVarsOptionalSectionProps {
    configuredOptionalVars: ExtraVarsVariable[];
    defaultVars: ExtraVarsValueMap;
    onBatchChange?: (vars: ExtraVarsValueMap, mappings: ExtraVarsMappings) => void;
    onChange?: (vars: ExtraVarsValueMap) => void;
    onMappingsChange?: (mappings: ExtraVarsMappings) => void;
    optionalVars: ExtraVarsVariable[];
    requiredVars: ExtraVarsVariable[];
    setVarModes: VariableModesSetter;
    value: ExtraVarsValueMap;
    variableMappings: ExtraVarsMappings;
    varModes: VariableModeMap;
}

const getTagValue = (value: unknown) => (
    typeof value === 'object' ? JSON.stringify(value) : String(value)
);

const ExtraVarsOptionalSection: React.FC<ExtraVarsOptionalSectionProps> = ({
    configuredOptionalVars,
    defaultVars,
    onBatchChange,
    onChange,
    onMappingsChange,
    optionalVars,
    requiredVars,
    setVarModes,
    value,
    variableMappings,
    varModes,
}) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMappings, setModalMappings] = useState<ExtraVarsMappings>({});
    const [modalStaticValues, setModalStaticValues] = useState<ExtraVarsValueMap>({});

    if (optionalVars.length === 0) {
        return null;
    }

    const handleOpenModal = () => {
        const staticValuesCopy: ExtraVarsValueMap = {};
        optionalVars.forEach((variable) => {
            staticValuesCopy[variable.name] = value[variable.name] ?? defaultVars[variable.name];
        });

        const modalMappingsCopy: ExtraVarsMappings = {};
        const modesCopy: VariableModeMap = { ...varModes };
        optionalVars.forEach((variable) => {
            const mapping = variableMappings[variable.name];
            if (mapping) {
                modalMappingsCopy[variable.name] = mapping;
                modesCopy[variable.name] = 'expression';
            }
        });

        setModalStaticValues(staticValuesCopy);
        setModalMappings(modalMappingsCopy);
        setVarModes(modesCopy);
        setModalOpen(true);
    };

    const handleModalExpressionChange = (varName: string, expression: string) => {
        setModalMappings((currentMappings) => {
            const nextMappings = { ...currentMappings };
            if (expression) {
                nextMappings[varName] = expression;
            } else {
                delete nextMappings[varName];
            }
            return nextMappings;
        });
    };

    const handleModalStaticChange = (varName: string, currentValue: unknown) => {
        setModalStaticValues((currentValues) => ({
            ...currentValues,
            [varName]: currentValue,
        }));
    };

    const handleModalModeChange = (varName: string, mode: VariableInputMode) => {
        setVarModes((currentModes) => ({ ...currentModes, [varName]: mode }));
        if (mode === 'static') {
            setModalMappings((currentMappings) => {
                const nextMappings = { ...currentMappings };
                delete nextMappings[varName];
                return nextMappings;
            });
        }
    };

    const handleConfirm = () => {
        const requiredValues: ExtraVarsValueMap = {};
        requiredVars.forEach((variable) => {
            const currentValue = value[variable.name];
            if (currentValue !== undefined) {
                requiredValues[variable.name] = currentValue;
            }
        });

        const optionalStaticValues: ExtraVarsValueMap = {};
        optionalVars.forEach((variable) => {
            const mode = varModes[variable.name] || 'static';
            const currentValue = modalStaticValues[variable.name];
            if (mode === 'static' && hasConfiguredValue(currentValue)) {
                optionalStaticValues[variable.name] = currentValue;
            }
        });

        const nextValue = { ...requiredValues, ...optionalStaticValues };
        const nextMappings = { ...variableMappings };
        requiredVars.forEach((variable) => {
            const mapping = variableMappings[variable.name];
            if (mapping) {
                nextMappings[variable.name] = mapping;
            }
        });
        optionalVars.forEach((variable) => {
            const mapping = modalMappings[variable.name];
            if (mapping) {
                nextMappings[variable.name] = mapping;
            } else {
                delete nextMappings[variable.name];
            }
        });

        if (onBatchChange) {
            console.log('Using Batch Change:', { newValue: nextValue, newMappings: nextMappings });
            onBatchChange(nextValue, nextMappings);
        } else {
            console.warn('onBatchChange NOT available, using individual updates');
            onChange?.(nextValue);
            onMappingsChange?.(nextMappings);
        }

        setModalOpen(false);
    };

    return (
        <div>
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <SettingOutlined style={{ color: '#1890ff', fontSize: 12 }} />
                <Text type="secondary" style={{ fontSize: 12 }}>可选变量</Text>
            </div>
            <div
                style={{
                    border: '1px solid #f0f0f0',
                    borderRadius: 0,
                    padding: '12px',
                    background: configuredOptionalVars.length > 0 ? '#fafafa' : 'transparent',
                }}
            >
                {configuredOptionalVars.length > 0 ? (
                    <div>
                        <div
                            style={{
                                marginBottom: 8,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                <CheckOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                                已配置 {configuredOptionalVars.length} 个可选变量
                            </Text>
                            <Button type="link" size="small" onClick={handleOpenModal}>
                                编辑
                            </Button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {configuredOptionalVars.map((variable) => {
                                const mapping = variableMappings[variable.name];
                                return (
                                    <Tag key={variable.name} style={{ fontSize: 11 }} color={mapping ? 'blue' : undefined}>
                                        {variable.name}: {mapping ? `expr(${mapping})` : getTagValue(value[variable.name])}
                                    </Tag>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>未配置可选变量</Text>
                        <br />
                        <Button type="link" icon={<SettingOutlined />} onClick={handleOpenModal}>
                            配置变量
                        </Button>
                    </div>
                )}
            </div>

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
                        {optionalVars.map((variable) => (
                            <ExtraVarsVariableRow
                                key={variable.name}
                                variable={variable}
                                isRequired={false}
                                mode={varModes[variable.name] || 'static'}
                                staticValue={modalStaticValues[variable.name]}
                                onStaticChange={handleModalStaticChange}
                                expressionMappings={modalMappings}
                                onExpressionChange={handleModalExpressionChange}
                                onModeChange={handleModalModeChange}
                            />
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ExtraVarsOptionalSection;

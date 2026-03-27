import { Button, Empty, Spin, Tag } from 'antd';
import { CodeOutlined } from '@ant-design/icons';
import VariableInput from '@/components/VariableInput';
import {
    getPlaybookVariables,
    type VariableValueMap,
} from '../templates/templateVariableHelpers';

interface ScheduleVariableOverridesCardProps {
    displayValues: VariableValueMap;
    loadingPlaybook: boolean;
    overrideValues: VariableValueMap;
    templatePlaybook: AutoHealing.Playbook | null;
    onVariableClear: (name: string) => void;
    onVariableChange: (name: string, value: unknown) => void;
}

const ScheduleVariableOverridesCard: React.FC<ScheduleVariableOverridesCardProps> = ({
    displayValues,
    loadingPlaybook,
    overrideValues,
    templatePlaybook,
    onVariableClear,
    onVariableChange,
}) => {
    const variables = getPlaybookVariables(templatePlaybook);

    return (
        <div className="template-form-card">
            <h4 className="template-form-section-title">
                <CodeOutlined />
                变量覆盖
                {templatePlaybook && (
                    <Tag color="blue" style={{ marginLeft: 8, fontWeight: 400 }}>
                        {templatePlaybook.name}
                    </Tag>
                )}
                <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 400, color: '#8c8c8c' }}>
                    {variables.length > 0 ? `${variables.filter((item) => item.required).length} 必填 / ${variables.length} 总计` : ''}
                </span>
            </h4>
            {loadingPlaybook ? (
                <div className="template-form-var-empty">
                    <Spin tip="加载变量...">
                        <div />
                    </Spin>
                </div>
            ) : variables.length === 0 ? (
                <div className="template-form-var-empty">
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="该 Playbook 无可配置变量" />
                </div>
            ) : (
                variables.map((variable) => (
                    <div key={variable.name} className="template-form-var-row">
                        <div className="template-form-var-label">
                            <div>
                                <span className="var-name">{variable.name}</span>
                                {variable.required && <span className="var-required">*</span>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="var-type">{variable.type}</div>
                                {Object.prototype.hasOwnProperty.call(overrideValues, variable.name) && (
                                    <Button
                                        type="link"
                                        size="small"
                                        style={{ padding: 0, height: 'auto' }}
                                        onClick={() => onVariableClear(variable.name)}
                                    >
                                        继承模板
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="template-form-var-input">
                            <VariableInput
                                variable={variable}
                                value={displayValues[variable.name]}
                                onChange={(value) => onVariableChange(variable.name, value)}
                            />
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default ScheduleVariableOverridesCard;

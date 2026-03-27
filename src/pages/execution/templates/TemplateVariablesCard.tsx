import { Empty, Form, Input, Space, Spin, Switch, Tag, Typography } from 'antd';
import { SearchOutlined, SettingOutlined } from '@ant-design/icons';
import VariableInput from '@/components/VariableInput';
import type {
    TemplateVariableRecord,
    VariableValueMap,
} from './templateVariableHelpers';

const { Text } = Typography;

interface TemplateVariablesCardProps {
    filteredVariables: TemplateVariableRecord[];
    loadingPlaybook: boolean;
    selectedPlaybook?: AutoHealing.Playbook;
    showOnlyRequired: boolean;
    varSearch: string;
    variableValues: VariableValueMap;
    variables: TemplateVariableRecord[];
    onShowOnlyRequiredChange: (checked: boolean) => void;
    onVarSearchChange: (value: string) => void;
    onVariableChange: (name: string, value: unknown) => void;
}

const TemplateVariablesCard: React.FC<TemplateVariablesCardProps> = ({
    filteredVariables,
    loadingPlaybook,
    selectedPlaybook,
    showOnlyRequired,
    varSearch,
    variableValues,
    variables,
    onShowOnlyRequiredChange,
    onVarSearchChange,
    onVariableChange,
}) => (
    <div className="template-form-card">
        <h4 className="template-form-section-title">
            <SettingOutlined />
            变量配置
            {selectedPlaybook && (
                <Tag color="blue" style={{ marginLeft: 8, fontWeight: 400 }}>
                    {selectedPlaybook.name}
                </Tag>
            )}
            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 400, color: '#8c8c8c' }}>
                {variables.length > 0 ? `${variables.filter((item) => item.required).length} 必填 / ${variables.length} 总计` : ''}
            </span>
        </h4>

        {variables.length > 0 && (
            <div className="template-form-var-toolbar">
                <Input
                    placeholder="搜索变量名..."
                    prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                    value={varSearch}
                    onChange={(event) => onVarSearchChange(event.target.value)}
                    allowClear
                    style={{ width: 220 }}
                />
                <Space>
                    <Text style={{ fontSize: 13 }}>仅必填</Text>
                    <Switch size="small" checked={showOnlyRequired} onChange={onShowOnlyRequiredChange} />
                </Space>
            </div>
        )}

        {!selectedPlaybook ? (
            <div className="template-form-var-empty">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请先在上方选择 Playbook，变量将自动加载" />
            </div>
        ) : loadingPlaybook ? (
            <div className="template-form-var-empty">
                <Spin tip="正在解析变量...">
                    <div />
                </Spin>
            </div>
        ) : filteredVariables.length === 0 ? (
            <div className="template-form-var-empty">
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={variables.length === 0 ? '该 Playbook 无可配置变量' : '未找到匹配的变量'}
                />
            </div>
        ) : (
            filteredVariables.map((record) => (
                <div key={record.name} className="template-form-var-row">
                    <div className="template-form-var-label">
                        <div>
                            <span className="var-name">{record.name}</span>
                            {record.required && <span className="var-required">*</span>}
                        </div>
                        <div className="var-type">{record.type}</div>
                    </div>
                    <div className="template-form-var-input">
                        <Form.Item style={{ marginBottom: 0 }} rules={[{ required: record.required, message: '必填' }]}>
                            <VariableInput
                                variable={record}
                                value={variableValues[record.name]}
                                onChange={(value) => onVariableChange(record.name, value)}
                            />
                        </Form.Item>
                    </div>
                </div>
            ))
        )}
    </div>
);

export default TemplateVariablesCard;

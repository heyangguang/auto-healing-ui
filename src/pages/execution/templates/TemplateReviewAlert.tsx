import { Alert, Tag } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface TemplateReviewAlertProps {
    changedVariables: ReadonlyArray<unknown>;
    visible: boolean;
}

function getChangedVariableName(variable: unknown) {
    if (typeof variable === 'string') {
        return variable;
    }
    if (variable && typeof variable === 'object' && 'name' in variable) {
        return String((variable as { name?: unknown }).name || '');
    }
    return '';
}

const TemplateReviewAlert: React.FC<TemplateReviewAlertProps> = ({
    changedVariables,
    visible,
}) => {
    if (!visible) {
        return null;
    }

    return (
        <Alert
            message={<span style={{ fontWeight: 600, fontSize: 15 }}>Playbook 变量变更待确认</span>}
            description={
                <div style={{ marginTop: 8 }}>
                    <div style={{ color: '#595959', marginBottom: 12 }}>
                        检测到 Playbook 定义已更新。保存将自动确认变更。
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {changedVariables.map((variable) => {
                            const name = getChangedVariableName(variable);
                            return (
                                <Tag key={name} color="orange">
                                    {name}
                                </Tag>
                            );
                        })}
                    </div>
                </div>
            }
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined style={{ fontSize: 20 }} />}
            style={{ border: '1px solid #ffe58f' }}
        />
    );
};

export default TemplateReviewAlert;

import { CheckOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Tag } from 'antd';

function getChangedVariableName(variable: unknown) {
    if (typeof variable === 'string') {
        return variable;
    }
    if (variable && typeof variable === 'object' && 'name' in variable) {
        return String((variable as { name?: unknown }).name || '');
    }
    return '';
}

interface TemplateDetailReviewAlertProps {
    canConfirmReview: boolean;
    changedVariables: ReadonlyArray<unknown>;
    confirming: boolean;
    onConfirmReview: () => void;
    visible: boolean;
}

const TemplateDetailReviewAlert: React.FC<TemplateDetailReviewAlertProps> = ({
    canConfirmReview,
    changedVariables,
    confirming,
    onConfirmReview,
    visible,
}) => {
    if (!visible || changedVariables.length === 0) {
        return null;
    }

    return (
        <Alert
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
            message={<span style={{ fontWeight: 600 }}>Playbook 变量变更待确认</span>}
            description={(
                <div style={{ marginTop: 8 }}>
                    <div style={{ color: '#595959', marginBottom: 10 }}>
                        检测到 Playbook 定义已更新，以下变量发生了变更，请确认：
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                        {changedVariables.map((variable) => {
                            const name = getChangedVariableName(variable);
                            return (
                                <Tag key={name} color="orange" style={{ margin: 0, fontSize: 11 }}>
                                    {name}
                                </Tag>
                            );
                        })}
                    </div>
                    <Button
                        type="primary"
                        size="small"
                        icon={<CheckOutlined />}
                        loading={confirming}
                        disabled={!canConfirmReview}
                        onClick={onConfirmReview}
                        style={{ background: '#faad14', borderColor: '#faad14' }}
                    >
                        确认变更并同步
                    </Button>
                </div>
            )}
        />
    );
};

export default TemplateDetailReviewAlert;

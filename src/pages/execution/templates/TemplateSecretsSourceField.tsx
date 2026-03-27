import { Button, Tag } from 'antd';
import { PlusOutlined, SafetyCertificateOutlined } from '@ant-design/icons';

interface TemplateSecretsSourceFieldProps {
    secretIds: string[];
    secretsSources: AutoHealing.SecretsSource[];
    onOpen: () => void;
    onRemove: (sourceId: string) => void;
}

const TemplateSecretsSourceField: React.FC<TemplateSecretsSourceFieldProps> = ({
    secretIds,
    secretsSources,
    onOpen,
    onRemove,
}) => (
    <div className="template-form-secrets-display">
        {secretIds.map((sourceId) => {
            const source = secretsSources.find((item) => item.id === sourceId);
            return (
                <Tag
                    key={sourceId}
                    closable
                    onClose={() => onRemove(sourceId)}
                    color="blue"
                    style={{ fontSize: 12 }}
                >
                    <SafetyCertificateOutlined style={{ marginRight: 4 }} />
                    {source?.name || sourceId.substring(0, 8)}
                </Tag>
            );
        })}
        <Button
            type="dashed"
            size="small"
            icon={<PlusOutlined />}
            onClick={onOpen}
            style={{ fontSize: 12, height: 24, borderRadius: 4 }}
        >
            添加密钥源
        </Button>
    </div>
);

export default TemplateSecretsSourceField;

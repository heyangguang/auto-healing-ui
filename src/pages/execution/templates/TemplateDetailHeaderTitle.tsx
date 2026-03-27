import { Tag, Typography } from 'antd';
import { ExecutorIcon } from './TemplateIcons';

const { Text } = Typography;

interface TemplateDetailHeaderTitleProps {
    template: AutoHealing.ExecutionTask;
    templateId?: string;
}

const TemplateDetailHeaderTitle: React.FC<TemplateDetailHeaderTitleProps> = ({
    template,
    templateId,
}) => (
    <div className="tpl-detail-header-title">
        <ExecutorIcon executorType={template.executor_type} size={32} iconSize={18} />
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{template.name}</span>
                <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                    #{templateId?.substring(0, 8)}
                </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>任务模板</Tag>
                {template.needs_review && <Tag color="orange" style={{ margin: 0, fontSize: 11 }}>变量待确认</Tag>}
            </div>
        </div>
    </div>
);

export default TemplateDetailHeaderTitle;

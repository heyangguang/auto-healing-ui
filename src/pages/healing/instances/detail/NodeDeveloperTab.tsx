import React from 'react';
import {
    Card,
    Empty,
} from 'antd';
import {
    CodeOutlined,
    NodeIndexOutlined,
    TagOutlined,
} from '@ant-design/icons';
import JsonPrettyView from '../components/JsonPrettyView';

type NodeDeveloperTabProps = {
    contextEntries: Array<[string, unknown]>;
    filteredConfig: Record<string, unknown>;
    nodeState?: Record<string, unknown>;
};

const NodeDeveloperTab: React.FC<NodeDeveloperTabProps> = ({
    contextEntries,
    filteredConfig,
    nodeState,
}) => (
    <div style={{ padding: '16px 20px', height: 'calc(100vh - 160px)', overflow: 'auto' }}>
        <Card size="small" title={<span style={{ fontSize: 13, fontWeight: 600 }}><TagOutlined style={{ marginRight: 6 }} />配置参数</span>} style={{ marginBottom: 16 }}>
            {Object.keys(filteredConfig).length === 0
                ? <Empty description="暂无配置参数" style={{ padding: '20px 0' }} />
                : <JsonPrettyView data={filteredConfig} />}
        </Card>

        <Card size="small" title={<span style={{ fontSize: 13, fontWeight: 600 }}><NodeIndexOutlined style={{ marginRight: 6 }} />运行时上下文</span>} style={{ marginBottom: 16 }}>
            {contextEntries.length === 0
                ? <Empty description="暂无上下文数据" style={{ padding: '20px 0' }} />
                : <JsonPrettyView data={Object.fromEntries(contextEntries)} />}
        </Card>

        {nodeState && (
            <Card size="small" title={<span style={{ fontSize: 13, fontWeight: 600 }}><CodeOutlined style={{ marginRight: 6 }} />原始状态快照</span>} style={{ marginBottom: 16 }}>
                <JsonPrettyView data={nodeState} />
            </Card>
        )}
    </div>
);

export default NodeDeveloperTab;

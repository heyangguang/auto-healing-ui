import React from 'react';
import { Alert, Button, Card, Col, Modal, Row, Statistic, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import HostSelector from '@/components/HostSelector';

const { Text } = Typography;

type SecretsSourceTestModalsProps = {
    onCloseResult: () => void;
    onCloseTestQuery: () => void;
    onSubmitTestQuery: () => void;
    onUpdateHosts: (items: AutoHealing.CMDBItem[]) => void;
    onUpdateIps: (values: string[]) => void;
    selectedTestHostIps: string[];
    testQueryModalOpen: boolean;
    testQuerySource: AutoHealing.SecretsSource | null;
    testResultModalOpen: boolean;
    testResults: {
        success_count: number;
        fail_count: number;
        results: AutoHealing.TestQueryBatchResult[];
    } | null;
    testingId?: string;
};

export default function SecretsSourceTestModals(props: SecretsSourceTestModalsProps) {
    const {
        onCloseResult,
        onCloseTestQuery,
        onSubmitTestQuery,
        onUpdateHosts,
        onUpdateIps,
        selectedTestHostIps,
        testQueryModalOpen,
        testQuerySource,
        testResultModalOpen,
        testResults,
        testingId,
    } = props;

    return (
        <>
            <Modal
                title={`测试凭据 - ${testQuerySource?.name || ''}`}
                open={testQueryModalOpen}
                onCancel={onCloseTestQuery}
                onOk={onSubmitTestQuery}
                okText="测试"
                cancelText="取消"
                confirmLoading={!!testingId}
                width={800}
                styles={{ body: { padding: 0 } }}
            >
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                    <Alert
                        type="info"
                        showIcon
                        message={testQuerySource?.config?.query_key
                            ? `当前密钥源按 ${testQuerySource.config.query_key === 'ip' ? 'IP' : '主机名'} 查询凭据`
                            : '当前密钥源所有主机共用同一凭据'}
                        style={{ marginBottom: 0 }}
                    />
                </div>
                <div style={{ padding: 24 }}>
                    <div style={{ marginBottom: 12 }}>
                        <Text strong>选择要测试的主机：</Text>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                            请选择一到多台主机进行凭据有效性测试。测试过程将尝试使用该密钥源的配置连接到目标主机。
                        </div>
                    </div>
                    <HostSelector value={selectedTestHostIps} onChange={onUpdateIps} onChangeItems={onUpdateHosts} />
                </div>
            </Modal>

            <Modal
                title="测试结果"
                open={testResultModalOpen}
                onCancel={onCloseResult}
                footer={[<Button key="close" type="primary" onClick={onCloseResult}>关闭</Button>]}
                width={600}
            >
                {testResults && (
                    <>
                        <Row gutter={12} style={{ marginBottom: 12 }}>
                            <Col span={8}><Card size="small"><Statistic title="总数" value={testResults.success_count + testResults.fail_count} /></Card></Col>
                            <Col span={8}><Card size="small"><Statistic title="成功" value={testResults.success_count} styles={{ content: { color: '#52c41a' } }} /></Card></Col>
                            <Col span={8}><Card size="small"><Statistic title="失败" value={testResults.fail_count} styles={{ content: { color: '#ff4d4f' } }} /></Card></Col>
                        </Row>
                        <div style={{ maxHeight: 350, overflow: 'auto' }}>
                            {testResults.results.map((result) => (
                                <div key={`${result.hostname || result.ip_address}-${result.success ? 'ok' : 'fail'}`} style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', background: result.success ? '#f6ffed' : '#fff2f0', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: result.success ? 0 : 6 }}>
                                        {result.success
                                            ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                                            : <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />}
                                        <Text strong>{result.hostname || result.ip_address}</Text>
                                        {result.hostname && <Text type="secondary" style={{ fontSize: 12 }}>({result.ip_address})</Text>}
                                    </div>
                                    {!result.success && (
                                        <div style={{ marginLeft: 24 }}>
                                            <Text type="danger" style={{ fontSize: 12, wordBreak: 'break-all' }}>{result.message}</Text>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </Modal>
        </>
    );
}

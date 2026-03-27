import React from 'react';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    DeleteOutlined,
    ExperimentOutlined,
    FileTextOutlined,
    FireOutlined,
    LoadingOutlined,
    SelectOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import {
    Badge,
    Button,
    Checkbox,
    Empty,
    Progress,
    Space,
    Spin,
    Tabs,
    Tag,
    Tooltip,
    Typography,
    Input,
} from 'antd';
import { FILE_TYPE_COLORS } from './blacklistRuleFormOptions';
import { formatLoadedFileSize } from './blacklistRuleFormUtils';
import type {
    LoadedFile,
    SimulationMode,
    SimulateResultLine,
} from './blacklistRuleFormTypes';

const { Text } = Typography;
const { TextArea } = Input;

type Props = {
    loadedFiles: LoadedFile[];
    loadingPlaybook: boolean;
    loadProgress: number;
    matchCount: number;
    matchedFiles: string[];
    selectedPlaybookName: string;
    selectedTemplateName: string;
    simMode: SimulationMode;
    simulating: boolean;
    testInput: string;
    testResults: SimulateResultLine[] | null;
    onClearLoaded: () => void;
    onFileCheckChange: (filePath: string, checked: boolean) => void;
    onManualInputChange: (value: string) => void;
    onModeChange: (mode: SimulationMode) => void;
    onOpenSelector: () => void;
};

const BlacklistRuleSimulationPanel: React.FC<Props> = ({
    loadedFiles,
    loadingPlaybook,
    loadProgress,
    matchCount,
    matchedFiles,
    selectedPlaybookName,
    selectedTemplateName,
    simMode,
    simulating,
    testInput,
    testResults,
    onClearLoaded,
    onFileCheckChange,
    onManualInputChange,
    onModeChange,
    onOpenSelector,
}) => (
    <div className="blacklist-form-card">
        <h4 className="blacklist-form-section-title">
            <ExperimentOutlined />
            仿真测试
            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 400 }}>
                {simulating ? (
                    <Tag color="processing" style={{ margin: 0 }}>
                        <LoadingOutlined /> 匹配中...
                    </Tag>
                ) : testResults && testResults.length > 0 ? (
                    matchCount > 0 ? (
                        <Tag color="red" style={{ margin: 0 }}>
                            <FireOutlined /> 命中 {matchCount} 行（{matchedFiles.length} 个文件）
                        </Tag>
                    ) : (
                        <Tag color="green" style={{ margin: 0 }}>
                            <CheckCircleOutlined /> 无匹配
                        </Tag>
                    )
                ) : null}
            </span>
        </h4>

        <Tabs
            activeKey={simMode}
            onChange={(key) => onModeChange(key as SimulationMode)}
            size="small"
            items={[
                {
                    key: 'template',
                    label: <span><SelectOutlined /> 选择任务模板</span>,
                    children: (
                        <div style={{ paddingTop: 4 }}>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
                                选择任务模板自动加载 Playbook 的所有关联文件（入口文件、tasks、templates、handlers 等），实时验证当前规则的匹配效果。
                            </Text>

                            <div className="blacklist-sim-toolbar">
                                <Button icon={<SelectOutlined />} onClick={onOpenSelector} loading={loadingPlaybook}>
                                    {selectedTemplateName ? '重新选择任务模板' : '选择任务模板'}
                                </Button>
                                {selectedTemplateName && (
                                    <>
                                        <div className="blacklist-sim-selected-info">
                                            <Tag color="blue">{selectedTemplateName}</Tag>
                                            <Tag color="green">{selectedPlaybookName}</Tag>
                                            <Tag>{loadedFiles.length} 个文件</Tag>
                                        </div>
                                        <Button
                                            type="text"
                                            size="small"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={onClearLoaded}
                                        >
                                            清除
                                        </Button>
                                    </>
                                )}
                            </div>

                            {loadingPlaybook && (
                                <Progress
                                    percent={loadProgress}
                                    size="small"
                                    status="active"
                                    style={{ marginBottom: 12 }}
                                />
                            )}

                            {loadedFiles.length > 0 && (
                                <div className="blacklist-sim-files">
                                    <div className="blacklist-sim-files-header">
                                        <Text strong style={{ fontSize: 12 }}>
                                            <FileTextOutlined /> 已加载文件
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            勾选参与检测的文件（{loadedFiles.filter((file) => file.checked).length}/{loadedFiles.length}）
                                        </Text>
                                    </div>
                                    <div className="blacklist-sim-files-body">
                                        {loadedFiles.map((file) => {
                                            const isHit = matchedFiles.includes(file.path);
                                            const hitCount =
                                                testResults?.filter((line) => line.matched && line.file === file.path).length || 0;

                                            return (
                                                <div
                                                    key={file.path}
                                                    className={`blacklist-sim-file-item ${isHit ? 'hit' : ''}`}
                                                >
                                                    <Checkbox
                                                        checked={file.checked}
                                                        onChange={(event) => onFileCheckChange(file.path, event.target.checked)}
                                                    />
                                                    <Tag
                                                        color={FILE_TYPE_COLORS[file.type] || '#999'}
                                                        style={{ fontSize: 10, margin: 0, minWidth: 56, textAlign: 'center' }}
                                                    >
                                                        {file.type}
                                                    </Tag>
                                                    <span className="blacklist-sim-file-path">{file.path}</span>
                                                    <span className="blacklist-sim-file-size">
                                                        {formatLoadedFileSize(file.size)}
                                                    </span>
                                                    {isHit && <Badge count={hitCount} size="small" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {!selectedTemplateName && !loadingPlaybook && (
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="请选择一个任务模板来加载 Playbook 文件"
                                    style={{ margin: '24px 0' }}
                                />
                            )}
                        </div>
                    ),
                },
                {
                    key: 'manual',
                    label: <span><FileTextOutlined /> 手动输入</span>,
                    children: (
                        <div style={{ paddingTop: 4 }}>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
                                粘贴或输入任意文本内容，每一行独立检测是否匹配当前规则。
                            </Text>
                            <TextArea
                                value={testInput}
                                onChange={(event) => onManualInputChange(event.target.value)}
                                placeholder={'粘贴或输入测试内容，每一行独立检测，例如：\n\nrm -rf /tmp/logs\necho "hello world"\ndd if=/dev/zero of=/dev/sda'}
                                rows={6}
                                style={{ fontFamily: "'SFMono-Regular', Consolas, monospace", fontSize: 13 }}
                            />
                        </div>
                    ),
                },
            ]}
        />

        <Spin spinning={simulating} tip="后端匹配中...">
            {testResults && testResults.length > 0 && (
                <div className="blacklist-test-results">
                    <div className="blacklist-test-results-header">
                        <Text strong style={{ fontSize: 13 }}>检测结果</Text>
                        <Space size={16}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                共 {testResults.length} 行
                            </Text>
                            {matchCount > 0 && (
                                <Text style={{ fontSize: 12, color: '#ff4d4f' }}>
                                    <CloseCircleOutlined /> {matchCount} 行命中
                                </Text>
                            )}
                        </Space>
                    </div>
                    <div className="blacklist-test-results-body">
                        {testResults.map((result) => (
                            <div
                                key={`${result.line}-${result.file || 'manual'}`}
                                className={`blacklist-test-line ${result.matched ? 'matched' : ''}`}
                            >
                                <span className="blacklist-test-line-num">{result.line}</span>
                                {result.file && loadedFiles.length > 0 && (
                                    <Tooltip title={result.file}>
                                        <span className="blacklist-test-line-file">
                                            {result.file.split('/').pop()}
                                        </span>
                                    </Tooltip>
                                )}
                                <span className="blacklist-test-line-content">{result.content || ' '}</span>
                                {result.matched && (
                                    <span className="blacklist-test-line-badge">
                                        <WarningOutlined /> 命中
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Spin>
    </div>
);

export default BlacklistRuleSimulationPanel;

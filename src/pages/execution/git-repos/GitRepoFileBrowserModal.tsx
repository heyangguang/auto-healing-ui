import React from 'react';
import { FileOutlined, FolderOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Empty, Modal, Space, Spin, Tree, Typography } from 'antd';
import type { DataNode } from 'antd/es/tree';
import type { GitRepositoryRecord } from '@/services/auto-healing/git-repos';

const { Text } = Typography;

type GitRepoFileBrowserModalProps = {
    fileBrowserOpen: boolean;
    fileContent: string;
    fileTree: DataNode[];
    loadingContent: boolean;
    loadingFiles: boolean;
    onCancel: () => void;
    onRefresh: (id: string) => void;
    onSelectFile: (id: string, path: string) => void;
    selectedFilePath: string;
    selectedRepo?: GitRepositoryRecord;
};

export default function GitRepoFileBrowserModal(props: GitRepoFileBrowserModalProps) {
    const {
        fileBrowserOpen,
        fileContent,
        fileTree,
        loadingContent,
        loadingFiles,
        onCancel,
        onRefresh,
        onSelectFile,
        selectedFilePath,
        selectedRepo,
    } = props;

    if (!selectedRepo) {
        return null;
    }

    return (
        <Modal
            title={<Space><FolderOutlined />{selectedRepo.name} - 文件浏览</Space>}
            open={fileBrowserOpen}
            onCancel={onCancel}
            footer={null}
            width={1000}
            styles={{ body: { padding: 0 } }}
            getContainer={false}
            zIndex={1100}
        >
            <div style={{ display: 'flex', height: 500 }}>
                <div style={{ width: 260, borderRight: '1px solid #f0f0f0', overflow: 'auto', padding: 8 }}>
                    <Button
                        size="small"
                        icon={<ReloadOutlined spin={loadingFiles} />}
                        onClick={() => onRefresh(selectedRepo.id)}
                        loading={loadingFiles}
                        style={{ marginBottom: 8 }}
                    >
                        刷新
                    </Button>
                    {loadingFiles ? (
                        <Spin />
                    ) : fileTree.length > 0 ? (
                        <Tree
                            showLine
                            treeData={fileTree}
                            onSelect={(_, info) => {
                                const node = info.node as DataNode;
                                if (node.isLeaf) {
                                    onSelectFile(selectedRepo.id, node.key as string);
                                }
                            }}
                        />
                    ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" />
                    )}
                </div>
                <div style={{ flex: 1, overflow: 'auto', background: '#1e1e1e' }}>
                    {loadingContent ? (
                        <div style={{ padding: 80, textAlign: 'center' }}><Spin /></div>
                    ) : fileContent ? (
                        <>
                            <div style={{ padding: '6px 12px', background: '#252526', borderBottom: '1px solid #3c3c3c' }}>
                                <Text style={{ color: '#aaa', fontSize: 11 }}>{selectedFilePath}</Text>
                            </div>
                            <pre style={{ color: '#d4d4d4', padding: 12, margin: 0, fontSize: 12, fontFamily: 'Consolas, monospace', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                                {fileContent}
                            </pre>
                        </>
                    ) : (
                        <div style={{ padding: 80, textAlign: 'center' }}>
                            <FileOutlined style={{ fontSize: 32, color: '#555' }} />
                            <div><Text style={{ color: '#888' }}>选择文件</Text></div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}

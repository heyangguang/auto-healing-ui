import React from 'react';
import { Badge, Button, Divider, Space, Spin, Tree, Typography } from 'antd';
import { FileTextOutlined, FolderOutlined, MinusSquareOutlined, PlusSquareOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';

const { Text, Title } = Typography;

type PlaybookImportFileSectionProps = {
    creating: boolean;
    expandedKeys: string[];
    fileTree: DataNode[];
    loadingFiles: boolean;
    selectedFiles: string[];
    onCheckFiles: (keys: string[]) => void;
    onCollapseAll: () => void;
    onExpandAll: () => void;
    onExpandKeysChange: (keys: string[]) => void;
};

export default function PlaybookImportFileSection(props: PlaybookImportFileSectionProps) {
    const { creating, expandedKeys, fileTree, loadingFiles, selectedFiles, onCheckFiles, onCollapseAll, onExpandAll, onExpandKeysChange } = props;

    return (
        <>
            <Divider dashed />
            <Title level={5} style={{ marginBottom: 16, color: '#595959' }}>
                <FileTextOutlined style={{ marginRight: 8 }} />选择入口文件
                {selectedFiles.length > 0 && <Badge count={selectedFiles.length} style={{ marginLeft: 8, backgroundColor: '#1890ff' }} />}
            </Title>

            {loadingFiles ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}><Spin tip="加载仓库文件..."><div /></Spin></div>
            ) : (
                <>
                    <div className="playbook-import-tree-toolbar">
                        <Space size={16}>
                            <Text type="secondary" style={{ fontSize: 12 }}><FolderOutlined style={{ color: '#faad14', marginRight: 4 }} />目录</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}><FileTextOutlined style={{ color: '#1890ff', marginRight: 4 }} />可选文件</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}><FileTextOutlined style={{ color: '#d9d9d9', marginRight: 4 }} />不可选</Text>
                        </Space>
                        <Space size={8}>
                            <Button size="small" icon={<PlusSquareOutlined />} onClick={onExpandAll} disabled={creating}>展开全部</Button>
                            <Button size="small" icon={<MinusSquareOutlined />} onClick={onCollapseAll} disabled={creating}>收起全部</Button>
                        </Space>
                    </div>

                    <div className="playbook-import-tree-container">
                        <Tree
                            checkable
                            showIcon
                            showLine={{ showLeafIcon: false }}
                            treeData={fileTree}
                            expandedKeys={expandedKeys}
                            onExpand={(keys) => onExpandKeysChange(keys as string[])}
                            checkedKeys={selectedFiles}
                            onCheck={(keys) => onCheckFiles(keys as string[])}
                            disabled={creating}
                            style={{ padding: 12 }}
                        />
                    </div>
                </>
            )}
        </>
    );
}

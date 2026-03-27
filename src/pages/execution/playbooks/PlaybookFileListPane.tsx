import React from 'react';
import { Tag, Typography } from 'antd';
import { FileTextOutlined, FolderOpenOutlined, FolderOutlined } from '@ant-design/icons';

const { Text } = Typography;

type DirectoryGroups = Record<string, AutoHealing.PlaybookFile[]>;

type PlaybookFileListPaneProps = {
    fileGroups: DirectoryGroups;
    directories: string[];
    onSelectFile: (filePath: string) => void;
    playbookFiles: AutoHealing.PlaybookFile[];
    selectedFilePath: string;
};

const getFileTypeColor = (type: AutoHealing.PlaybookFile['type']) => {
    if (type === 'entry') return 'blue';
    if (type === 'task') return 'green';
    if (type === 'vars') return 'orange';
    return 'default';
};

const getFileIconColor = (type: AutoHealing.PlaybookFile['type']) => (
    type === 'entry' ? '#1890ff' : '#57606a'
);

function renderEmptyFileTree() {
    return (
        <div style={{ padding: 24, textAlign: 'center' }}>
            <Text type="secondary">请先扫描变量</Text>
        </div>
    );
}

export default function PlaybookFileListPane(props: PlaybookFileListPaneProps) {
    const { fileGroups, directories, onSelectFile, playbookFiles, selectedFilePath } = props;

    return (
        <div
            style={{
                width: 320,
                flexShrink: 0,
                border: '1px solid #d0d7de',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <div
                style={{
                    padding: '8px 12px',
                    background: '#f6f8fa',
                    borderBottom: '1px solid #d0d7de',
                    fontWeight: 500,
                    fontSize: 13,
                }}
            >
                <FolderOpenOutlined style={{ marginRight: 8 }} />
                文件 ({playbookFiles.length})
            </div>
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 400px)' }}>
                {playbookFiles.length === 0 && renderEmptyFileTree()}
                {directories.map((directory) => (
                    <div key={directory}>
                        {directory !== '.' && (
                            <div
                                style={{
                                    padding: '6px 12px',
                                    background: '#f6f8fa',
                                    borderBottom: '1px solid #eaecef',
                                    fontSize: 12,
                                    color: '#57606a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <FolderOutlined />
                                <span>{directory}</span>
                            </div>
                        )}
                        {fileGroups[directory].map((file) => {
                            const fileName = file.path.split('/').pop();
                            const isSelected = selectedFilePath === file.path;
                            return (
                                <button
                                    key={file.path}
                                    type="button"
                                    onClick={() => onSelectFile(file.path)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        paddingLeft: directory !== '.' ? 32 : 12,
                                        cursor: 'pointer',
                                        background: isSelected ? '#ddf4ff' : 'transparent',
                                        border: 'none',
                                        borderBottom: '1px solid #eaecef',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        fontSize: 13,
                                        textAlign: 'left',
                                    }}
                                >
                                    <FileTextOutlined style={{ color: getFileIconColor(file.type) }} />
                                    <span style={{ flex: 1 }}>{fileName}</span>
                                    <Tag color={getFileTypeColor(file.type)} style={{ fontSize: 10, margin: 0 }}>
                                        {file.type}
                                    </Tag>
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

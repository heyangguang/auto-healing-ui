import React from 'react';
import { Empty, Spin, Typography } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';

const { Text } = Typography;

type PlaybookFileContentPaneProps = {
    fileContent: string;
    loadingFileContent: boolean;
    selectedFilePath: string;
};

export default function PlaybookFileContentPane(props: PlaybookFileContentPaneProps) {
    const { fileContent, loadingFileContent, selectedFilePath } = props;

    if (!selectedFilePath) {
        return (
            <div
                style={{
                    flex: 1,
                    border: '1px solid #d0d7de',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f6f8fa',
                }}
            >
                <Empty description="选择左侧文件查看内容" />
            </div>
        );
    }

    return (
        <div
            style={{
                flex: 1,
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                <FileTextOutlined />
                <Text style={{ fontFamily: 'monospace', fontSize: 13 }}>{selectedFilePath}</Text>
            </div>
            <div style={{ flex: 1, overflow: 'auto', background: '#0d1117' }}>
                {loadingFileContent ? (
                    <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
                ) : (
                    <pre
                        style={{
                            color: '#c9d1d9',
                            padding: 16,
                            margin: 0,
                            fontSize: 12,
                            fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                        }}
                    >
                        {fileContent}
                    </pre>
                )}
            </div>
        </div>
    );
}

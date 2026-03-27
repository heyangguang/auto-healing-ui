import { Empty, Spin, Tag, Typography } from 'antd';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sanitizeHtml } from '@/utils/safeHtml';

const { Text } = Typography;

type TemplatePreviewPaneProps = {
    format?: AutoHealing.TemplateFormat;
    previewData: AutoHealing.PreviewTemplateResponse | null;
    previewLoading: boolean;
};

const renderPreviewBody = (format: AutoHealing.TemplateFormat | undefined, body: string) => {
    if (format === 'html') {
        return (
            <div
                className="html-preview"
                style={{ lineHeight: 1.6, fontSize: 14 }}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }}
            />
        );
    }
    if (format === 'markdown') {
        return (
            <div className="markdown-preview" style={{ lineHeight: 1.6, fontSize: 14 }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {body}
                </ReactMarkdown>
            </div>
        );
    }
    return (
        <pre
            style={{
                whiteSpace: 'pre-wrap',
                fontFamily: "'SF Mono', 'Menlo', monospace",
                fontSize: 14,
                lineHeight: 1.6,
                margin: 0,
                background: '#f9f9f9',
                padding: 16,
                borderRadius: 4,
            }}
        >
            {body}
        </pre>
    );
};

const TemplatePreviewPane: React.FC<TemplatePreviewPaneProps> = ({
    format,
    previewData,
    previewLoading,
}) => (
    <div className="templates-preview-container">
        <div className="templates-preview-card">
            {previewLoading ? (
                <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
            ) : previewData ? (
                <div>
                    {previewData.subject && (
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>邮件主题</div>
                            <div style={{ fontSize: 16, fontWeight: 600 }}>{previewData.subject}</div>
                        </div>
                    )}
                    <div style={{ padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>消息正文</Text>
                            <Tag>{format || 'text'}</Tag>
                        </div>
                        {renderPreviewBody(format, previewData.body || '')}
                    </div>
                </div>
            ) : (
                <Empty description="无预览数据" />
            )}
        </div>
    </div>
);

export default TemplatePreviewPane;

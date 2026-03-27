import React from 'react';
import { ClockCircleOutlined, MailOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import type { SiteMessage } from '@/services/auto-healing/siteMessage';
import { sanitizeHtml } from '@/utils/safeHtml';
import dayjs from 'dayjs';

const { Text } = Typography;

export interface SystemMessageDetailPanelProps {
  messageRecord: SiteMessage;
  categoryMap: Record<string, string>;
}

function MessageHeader({ messageRecord, categoryMap }: SystemMessageDetailPanelProps) {
  return (
    <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#e6f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MailOutlined style={{ fontSize: 20, color: '#1677ff' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{messageRecord.title}</div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {categoryMap[messageRecord.category] || messageRecord.category}
          </Text>
        </div>
      </div>
    </div>
  );
}

function MessageMeta({ messageRecord }: Pick<SystemMessageDetailPanelProps, 'messageRecord'>) {
  return (
    <>
      <div style={{ marginBottom: 8 }}>
        <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          <ClockCircleOutlined style={{ marginRight: 4 }} />消息时间
        </Text>
      </div>
      <Text style={{ fontSize: 13 }}>{dayjs(messageRecord.created_at).format('YYYY-MM-DD HH:mm:ss')}</Text>
      {messageRecord.expires_at ? (
        <Text type="secondary" style={{ fontSize: 12, marginLeft: 12 }}>
          （过期：{dayjs(messageRecord.expires_at).format('YYYY-MM-DD')}）
        </Text>
      ) : null}
    </>
  );
}

function MessageContent({ content }: { content: string }) {
  return (
    <>
      <div style={{ margin: '16px 0 8px' }}>
        <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          消息内容
        </Text>
      </div>
      <div
        style={{ padding: '12px 16px', background: '#fafafa', borderRadius: 6, lineHeight: 1.8, fontSize: 14, color: '#333' }}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
      />
    </>
  );
}

export default function SystemMessageDetailPanel({
  messageRecord,
  categoryMap,
}: SystemMessageDetailPanelProps) {
  return (
    <>
      <MessageHeader messageRecord={messageRecord} categoryMap={categoryMap} />

      <div style={{ padding: '16px 24px' }}>
        <MessageMeta messageRecord={messageRecord} />
        <MessageContent content={messageRecord.content} />
      </div>
    </>
  );
}

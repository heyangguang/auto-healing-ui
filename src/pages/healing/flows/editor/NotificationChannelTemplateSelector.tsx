import React from 'react';
import { BellOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Modal, Space, Tag } from 'antd';
import NotificationChannelConfigList from './NotificationChannelConfigList';
import NotificationChannelSelectionStep from './NotificationChannelSelectionStep';
import NotificationTemplateSelectionStep from './NotificationTemplateSelectionStep';
import type { NotificationChannelTemplateSelectorProps } from './notificationChannelTemplateSelectorShared';
import useNotificationChannelTemplateSelector from './useNotificationChannelTemplateSelector';

const NotificationChannelTemplateSelector: React.FC<NotificationChannelTemplateSelectorProps> = ({
    value = [],
    onChange,
}) => {
    const selector = useNotificationChannelTemplateSelector({ value, onChange });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <NotificationChannelConfigList
                value={selector.value}
                getChannelName={selector.getChannelName}
                getChannelType={selector.getChannelType}
                getTemplateName={selector.getTemplateName}
                onRemove={selector.handleRemoveConfig}
            />

            <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={selector.openSelector}
                style={{ borderRadius: 4, borderColor: '#d9d9d9', color: '#595959', height: 40 }}
                loading={selector.loading}
            >
                添加通知配置
            </Button>

            <Modal
                title={(
                    <Space>
                        <BellOutlined style={{ color: '#1890ff' }} />
                        <span>{selector.step === 'channel' ? '选择通知渠道' : '选择消息模板'}</span>
                        <Tag color="blue">{selector.step === 'channel' ? '第 1 步' : '第 2 步'}</Tag>
                    </Space>
                )}
                open={selector.selectorOpen}
                onCancel={() => selector.setSelectorOpen(false)}
                footer={null}
                width={600}
                destroyOnHidden
                styles={{ body: { padding: '16px 24px' } }}
            >
                {selector.step === 'channel' ? (
                    <NotificationChannelSelectionStep
                        channelTypeFilter={selector.channelTypeFilter}
                        channelTypeStats={selector.channelTypeStats}
                        channelSearch={selector.channelSearch}
                        channels={selector.paginatedChannels}
                        currentPage={selector.channelPage}
                        loading={selector.loading}
                        total={selector.filteredChannels.length}
                        onChannelSearchChange={selector.handleChannelSearchChange}
                        onChannelTypeChange={selector.handleChannelTypeChange}
                        onPageChange={selector.setChannelPage}
                        onRefresh={selector.handleRefreshChannels}
                        onSelectChannel={selector.handleSelectChannel}
                    />
                ) : (
                    <NotificationTemplateSelectionStep
                        currentPage={selector.templatePage}
                        loading={selector.loadingTemplates}
                        selectedChannel={selector.selectedChannel}
                        templateSearch={selector.templateSearch}
                        templates={selector.paginatedTemplates}
                        total={selector.filteredTemplates.length}
                        onBack={selector.handleBackToChannel}
                        onPageChange={selector.setTemplatePage}
                        onRefresh={selector.handleRefreshTemplates}
                        onSelectTemplate={selector.handleSelectTemplate}
                        onTemplateSearchChange={selector.handleTemplateSearchChange}
                    />
                )}
            </Modal>
        </div>
    );
};

export default NotificationChannelTemplateSelector;

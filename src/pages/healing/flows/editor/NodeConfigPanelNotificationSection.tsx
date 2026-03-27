import React from 'react';
import { ProFormSelect } from '@ant-design/pro-components';
import { getChannels, getTemplates as getNotificationTemplates } from '@/services/auto-healing/notification';
import { fetchAllPages } from '@/utils/fetchAllPages';
import { VariableHint, getSelectedChannelTypes } from './NodeConfigPanelShared';
import type { ChannelInfo, NodeConfigNotificationSectionProps } from './nodeConfigPanelTypes';

type ChannelOption = { label: string; value: string };
type NotificationTemplateOption = { label: string; supported_channels: string[]; value: string };

function matchesTemplateSearch(input: string, option?: NotificationTemplateOption) {
    return String(option?.label || '').toLowerCase().includes(input.toLowerCase());
}

function supportsAllSelectedChannels(option: NotificationTemplateOption | undefined, selectedChannelTypes: string[]) {
    if (!option || selectedChannelTypes.length === 0 || option.supported_channels.length === 0) {
        return true;
    }

    return selectedChannelTypes.every((type) => option.supported_channels.includes(type));
}

function filterTemplateOption(input: string, option: NotificationTemplateOption | undefined, selectedChannelTypes: string[]) {
    if (!supportsAllSelectedChannels(option, selectedChannelTypes)) {
        return false;
    }

    return matchesTemplateSearch(input, option);
}

async function requestChannelOptions(onChannelListChange: (channels: ChannelInfo[]) => void) {
    const fetchedChannels = await fetchAllPages<AutoHealing.NotificationChannel>((page, pageSize) => getChannels({ page, page_size: pageSize }));
    const channels = fetchedChannels.map((channel) => ({ id: channel.id, name: channel.name, type: channel.type }));
    onChannelListChange(channels);
    return channels.map<ChannelOption>((channel) => ({ label: `${channel.name} (${channel.type})`, value: channel.id }));
}

async function requestTemplateOptions() {
    const templates = await fetchAllPages<AutoHealing.NotificationTemplate>((page, pageSize) => (
        getNotificationTemplates({ page, page_size: pageSize })
    ));

    return templates.map<NotificationTemplateOption>((template) => ({
        label: `${template.name}${template.supported_channels?.length ? ` (${template.supported_channels.join('/')})` : ''}`,
        value: template.id,
        supported_channels: template.supported_channels || [],
    }));
}

const NotificationChannelField: React.FC<{
    channelList: ChannelInfo[];
    formRef: NodeConfigNotificationSectionProps['formRef'];
    onChannelListChange: (channels: ChannelInfo[]) => void;
    onSelectedChannelTypesChange: (types: string[]) => void;
}> = ({ channelList, formRef, onChannelListChange, onSelectedChannelTypesChange }) => (
    <ProFormSelect
        name="channel_ids"
        label="通知渠道"
        mode="multiple"
        rules={[{ required: true, message: '请选择通知渠道' }]}
        request={() => requestChannelOptions(onChannelListChange)}
        fieldProps={{
            onChange: (selectedIds: string[]) => {
                onSelectedChannelTypesChange(getSelectedChannelTypes(selectedIds, channelList));
                formRef.current?.setFieldValue('template_id', undefined);
            },
        }}
        tooltip="先选择渠道，模板会根据渠道类型自动筛选"
    />
);

const NotificationTemplateField: React.FC<{ selectedChannelTypes: string[] }> = ({ selectedChannelTypes }) => (
    <ProFormSelect
        name="template_id"
        label="通知模板"
        rules={[{ required: true, message: '请选择通知模板' }]}
        dependencies={['channel_ids']}
        request={requestTemplateOptions}
        fieldProps={{
            showSearch: true,
            filterOption: (input: string, option?: NotificationTemplateOption) => (
                filterTemplateOption(input, option, selectedChannelTypes)
            ),
        }}
        tooltip={selectedChannelTypes.length > 0 ? `已筛选支持 ${selectedChannelTypes.join('+')} 的模板` : '请先选择渠道以筛选模板'}
    />
);

export const NodeConfigNotificationSection: React.FC<NodeConfigNotificationSectionProps> = ({
    channelList,
    formRef,
    onChannelListChange,
    onSelectedChannelTypesChange,
    selectedChannelTypes,
}) => (
    <>
        <VariableHint inputs={['incident', 'execution.result']} />
        <NotificationChannelField
            channelList={channelList}
            formRef={formRef}
            onChannelListChange={onChannelListChange}
            onSelectedChannelTypesChange={onSelectedChannelTypesChange}
        />
        <NotificationTemplateField selectedChannelTypes={selectedChannelTypes} />
    </>
);

import React from 'react';
import { render, screen } from '@testing-library/react';
import SelectorModalContent from './SelectorModalContent';

describe('SelectorModalContent', () => {
  it('renders display labels instead of raw channel keys', () => {
    render(
      <SelectorModalContent
        step="channel"
        channels={[{ id: 'c-1', name: '企业微信通知', type: 'wecom' }]}
        channelTypes={['wecom']}
        activeTab="all"
        searchText=""
        filteredChannels={[{ id: 'c-1', name: '企业微信通知', type: 'wecom' }]}
        selectedChannel={null}
        filteredTemplates={[]}
        getChannelName={() => '企业微信通知'}
        getChannelType={() => 'wecom'}
        onTabChange={jest.fn()}
        onSearchChange={jest.fn()}
        onSelectChannel={jest.fn()}
        onSelectTemplate={jest.fn()}
      />,
    );

    expect(screen.getByText('企业微信 (1)')).toBeTruthy();
    expect(screen.getAllByText('企业微信').length).toBeGreaterThan(0);
    expect(screen.queryByText('wecom')).toBeNull();
  });

  it('formats supported channel lists with display labels', () => {
    render(
      <SelectorModalContent
        step="template"
        channels={[]}
        channelTypes={[]}
        activeTab="all"
        searchText=""
        filteredChannels={[]}
        selectedChannel="c-1"
        filteredTemplates={[{ id: 't-1', name: '模板A', supported_channels: ['wecom', 'email'] }]}
        getChannelName={() => '企业微信通知'}
        getChannelType={() => 'wecom'}
        onTabChange={jest.fn()}
        onSearchChange={jest.fn()}
        onSelectChannel={jest.fn()}
        onSelectTemplate={jest.fn()}
      />,
    );

    expect(screen.getByText('支持: 企业微信, 邮件')).toBeTruthy();
    expect(screen.queryByText(/wecom|email/)).toBeNull();
  });
});

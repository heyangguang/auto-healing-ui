import {
  MinusCircleOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Collapse, Drawer, Input, Tag } from 'antd';
import React from 'react';

type DashboardWidgetOption = {
  description: string;
  icon: React.ReactNode;
  id: string;
  name: string;
};

type DashboardWidgetSection = {
  key: string;
  label: string;
  widgets: DashboardWidgetOption[];
};

type DashboardWidgetLibraryDrawerProps = {
  addedWidgetIds: Set<string>;
  filteredSections: DashboardWidgetSection[];
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onToggleWidget: (widgetId: string) => void;
  open: boolean;
  search: string;
};

const DashboardWidgetLibraryDrawer: React.FC<DashboardWidgetLibraryDrawerProps> = ({
  addedWidgetIds,
  filteredSections,
  onClose,
  onSearchChange,
  onToggleWidget,
  open,
  search,
}) => (
  <Drawer
    title={(
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>组件库</div>
        <Input
          placeholder="搜索组件名称..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          allowClear
          prefix={<SearchOutlined style={{ color: '#bbb' }} />}
          style={{ borderRadius: 0 }}
        />
      </div>
    )}
    placement="right"
    size={460}
    open={open}
    onClose={onClose}
    styles={{ body: { padding: '0 0 16px 0' } }}
  >
    <Collapse
      defaultActiveKey={filteredSections.slice(0, 3).map((section) => section.key)}
      ghost
      size="small"
      items={filteredSections.map((section) => ({
        key: section.key,
        label: (
          <span style={{ fontWeight: 600, fontSize: 13 }}>
            {section.label}
            <Tag style={{ marginLeft: 8, fontSize: 11, borderRadius: 0 }}>{section.widgets.length}</Tag>
          </span>
        ),
        children: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 4px' }}>
            {section.widgets.map((widget) => {
              const alreadyAdded = addedWidgetIds.has(widget.id);
              return (
                <div
                  key={widget.id}
                  onClick={() => onToggleWidget(widget.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 0,
                    background: alreadyAdded ? '#f6ffed' : '#fafafa',
                    border: `1px solid ${alreadyAdded ? '#b7eb8f' : '#f0f0f0'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(event) => {
                    if (alreadyAdded) {
                      event.currentTarget.style.borderColor = '#ff4d4f';
                      event.currentTarget.style.background = '#fff2f0';
                      return;
                    }
                    event.currentTarget.style.borderColor = '#1677ff';
                    event.currentTarget.style.background = '#e6f4ff';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.borderColor = alreadyAdded ? '#b7eb8f' : '#f0f0f0';
                    event.currentTarget.style.background = alreadyAdded ? '#f6ffed' : '#fafafa';
                  }}
                >
                  <span style={{ fontSize: 18, color: alreadyAdded ? '#52c41a' : '#1677ff', flexShrink: 0, width: 24, textAlign: 'center' }}>{widget.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>
                      {widget.name}
                      {alreadyAdded && <Tag color="green" style={{ marginLeft: 6, fontSize: 10, lineHeight: '16px', borderRadius: 0 }}>已添加</Tag>}
                    </div>
                    <div style={{ fontSize: 11, color: '#999', lineHeight: 1.3, marginTop: 2 }}>{widget.description}</div>
                  </div>
                  {alreadyAdded ? <MinusCircleOutlined style={{ color: '#ff4d4f', fontSize: 16 }} /> : <PlusOutlined style={{ color: '#1677ff', fontSize: 14 }} />}
                </div>
              );
            })}
          </div>
        ),
      }))}
    />
  </Drawer>
);

export default DashboardWidgetLibraryDrawer;

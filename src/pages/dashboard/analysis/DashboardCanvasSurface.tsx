import { AppstoreAddOutlined, DashboardOutlined } from '@ant-design/icons';
import StandardTable from '@/components/StandardTable';
import { Button, Empty, Typography } from 'antd';
import React from 'react';
import type { LayoutItem, WidgetInstance, DashboardWorkspace } from '../dashboardStore';
import { ResponsiveGridLayout, verticalCompactor } from 'react-grid-layout';
import DashboardWidgetRenderer from './DashboardWidgetRenderer';

const BREAKPOINT_COLS = { lg: 12, md: 10, sm: 6, xs: 4 } as const;

type DashboardCanvasSurfaceProps = {
  activeWorkspace: DashboardWorkspace;
  containerRef: React.RefObject<HTMLDivElement | null>;
  headerExtra: React.ReactNode;
  isEditing: boolean;
  onLayoutChange: (layout: readonly LayoutItem[], allLayouts: { lg?: readonly LayoutItem[]; md?: readonly LayoutItem[]; sm?: readonly LayoutItem[]; xs?: readonly LayoutItem[] }) => void;
  onOpenAddWidgetDrawer: () => void;
  onRemoveWidget: (instanceId: string) => void;
  responsiveLayouts: Record<string, LayoutItem[]>;
  visibleCount: number;
  workspaceCount: number;
  width: number;
};

const DashboardCanvasSurface: React.FC<DashboardCanvasSurfaceProps> = ({
  activeWorkspace,
  containerRef,
  headerExtra,
  isEditing,
  onLayoutChange,
  onOpenAddWidgetDrawer,
  onRemoveWidget,
  responsiveLayouts,
  visibleCount,
  workspaceCount,
  width,
}) => (
  <StandardTable<any>
    title="运维监控中心"
    description={`${workspaceCount} 个工作区 · ${activeWorkspace.widgets.length} 个组件`}
    headerIcon={<DashboardOutlined />}
    headerExtra={headerExtra}
  >
    {activeWorkspace.widgets.length === 0 ? (
      <div style={{ minHeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', border: '2px dashed #e0e0e0' }}>
        <Empty
          description={<Typography.Text type="secondary" style={{ fontSize: 14 }}>工作区为空，点击添加组件开始构建仪表盘</Typography.Text>}
        >
          <Button type="primary" size="large" icon={<AppstoreAddOutlined />} onClick={onOpenAddWidgetDrawer} style={{ borderRadius: 0 }}>
            添加组件
          </Button>
        </Empty>
      </div>
    ) : (
      <div
        ref={containerRef}
        style={{
          border: isEditing ? '2px dashed rgba(22,119,255,0.25)' : 'none',
          padding: isEditing ? 4 : 0,
          background: isEditing ? 'rgba(22,119,255,0.015)' : 'transparent',
          transition: 'border 0.15s, background 0.15s',
          minHeight: 400,
        }}
      >
        <ResponsiveGridLayout
          className={`dashboard-grid${isEditing ? ' editing' : ''}`}
          width={width || 1200}
          layouts={responsiveLayouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
          cols={BREAKPOINT_COLS}
          rowHeight={60}
          dragConfig={{ enabled: isEditing, handle: '.ant-card-head' }}
          resizeConfig={{ enabled: isEditing }}
          compactor={verticalCompactor}
          onLayoutChange={onLayoutChange}
          margin={[6, 6] as const}
        >
          {activeWorkspace.widgets.map((widget: WidgetInstance, index: number) => (
            <div key={widget.instanceId}>
              {index < visibleCount ? (
                <DashboardWidgetRenderer widget={widget} isEditing={isEditing} onRemove={onRemoveWidget} />
              ) : (
                <div style={{ height: '100%', background: '#fafafa', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d9d9d9', fontSize: 12 }}>
                  加载中...
                </div>
              )}
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    )}
  </StandardTable>
);

export default DashboardCanvasSurface;

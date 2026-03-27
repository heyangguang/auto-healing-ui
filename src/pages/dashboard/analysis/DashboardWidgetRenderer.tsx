import { useAccess } from '@umijs/max';
import { Empty, Spin } from 'antd';
import React from 'react';
import type { WidgetInstance } from '../dashboardStore';
import type { WidgetComponentProps } from '../widgets/widgetRegistry';
import { WIDGET_REGISTRY } from '../widgets/widgetRegistry';
import { canAccessDashboardWidget } from '../widgets/widgetAccess';

type DashboardWidgetRendererProps = {
  isEditing: boolean;
  onRemove: (id: string) => void;
  widget: WidgetInstance;
};

const DashboardWidgetRenderer = React.memo<DashboardWidgetRendererProps>(({ isEditing, onRemove, widget }) => {
  const access = useAccess();
  const definition = WIDGET_REGISTRY[widget.widgetId];
  if (!definition) {
    return (
      <div style={{ background: '#fafafa', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description="未知组件" />
      </div>
    );
  }
  if (!canAccessDashboardWidget(definition, access as Record<string, unknown>)) {
    return (
      <div style={{ background: '#fafafa', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description="无权限查看该组件" />
      </div>
    );
  }

  const Component = definition.component as React.ComponentType<WidgetComponentProps>;

  return (
    <React.Suspense
      fallback={(
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="small" />
        </div>
      )}
    >
      <Component
        widgetId={widget.widgetId}
        instanceId={widget.instanceId}
        isEditing={isEditing}
        onRemove={() => onRemove(widget.instanceId)}
      />
    </React.Suspense>
  );
});

export default DashboardWidgetRenderer;

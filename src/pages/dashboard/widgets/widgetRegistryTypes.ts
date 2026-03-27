import React from 'react';

export interface WidgetComponentProps {
  widgetId: string;
  instanceId: string;
  isEditing?: boolean;
  onRemove?: () => void;
}

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  category: 'stat' | 'chart' | 'list' | 'status';
  section?: string;
  icon: React.ReactNode;
  defaultLayout: { w: number; h: number; minW: number; minH: number };
  component: React.ElementType;
}

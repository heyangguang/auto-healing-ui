import React from 'react';
import { Drawer } from 'antd';
import type { SiteMessage } from '@/services/auto-healing/siteMessage';
import SystemMessageDetailPanel from './SystemMessageDetailPanel';

export interface SystemMessageDrawerProps {
  open: boolean;
  currentMessage: SiteMessage | null;
  categoryMap: Record<string, string>;
  onClose: () => void;
}

export default function SystemMessageDrawer({
  open,
  currentMessage,
  categoryMap,
  onClose,
}: SystemMessageDrawerProps) {
  return (
    <Drawer
      title={null}
      size={520}
      open={open}
      onClose={onClose}
      styles={{ header: { display: 'none' }, body: { padding: 0 } }}
    >
      {currentMessage ? <SystemMessageDetailPanel messageRecord={currentMessage} categoryMap={categoryMap} /> : null}
    </Drawer>
  );
}

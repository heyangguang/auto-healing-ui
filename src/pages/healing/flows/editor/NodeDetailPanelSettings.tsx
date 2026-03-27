import React from 'react';
import { NodeDetailPanelAutomationSettings } from './NodeDetailPanelAutomationSettings';
import { NodeDetailPanelBasicSettings } from './NodeDetailPanelBasicSettings';
import type { NodeDetailSettingsProps } from './NodeDetailPanel.types';

export const NodeDetailPanelSettings: React.FC<NodeDetailSettingsProps> = (props) => {
    const nodeType = props.node.data?.type || props.node.type;
    if (nodeType === 'execution' || nodeType === 'notification') {
        return <NodeDetailPanelAutomationSettings {...props} />;
    }
    return <NodeDetailPanelBasicSettings {...props} />;
};

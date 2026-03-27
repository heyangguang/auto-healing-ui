import React, { useMemo } from 'react';
import { Typography } from 'antd';
import { NODE_TYPE_CONFIG as nodeTypeConfig } from '../../nodeConfig';
import { getStatusIcon } from './NodeDetailPanelShared';
import { buildNodeTree, flattenNodeTree, getBranchLabelColor, getNodeLabel, NODE_TREE_INDENT_UNIT } from './nodeDetailPanelTree';
import type { NodeDetailPanelProps } from './NodeDetailPanel.types';

const { Text } = Typography;

const SIDEBAR_WIDTH = 200;
const NODE_LIST_TITLE_PADDING = '8px 12px';
const NODE_LIST_CONTENT_PADDING = '16px 0';
const ROW_PADDING_LEFT = 8;

type NodeDetailPanelSidebarProps = Pick<NodeDetailPanelProps, 'allEdges' | 'allNodes' | 'node' | 'onNodeSelect'>;

const renderBranchLabel = (branchLabel?: string) => {
    if (!branchLabel) {
        return null;
    }

    return (
        <span
            style={{
                fontSize: 11,
                marginLeft: 6,
                color: getBranchLabelColor(branchLabel),
            }}
        >
            ({branchLabel})
        </span>
    );
};

export const NodeDetailPanelSidebar: React.FC<NodeDetailPanelSidebarProps> = ({
    allEdges,
    allNodes,
    node,
    onNodeSelect,
}) => {
    const rows = useMemo(() => flattenNodeTree(buildNodeTree(allNodes, allEdges)), [allEdges, allNodes]);

    return (
        <div style={{ width: SIDEBAR_WIDTH, borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
            <div style={{ padding: NODE_LIST_TITLE_PADDING, borderBottom: '1px solid #f0f0f0' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>节点列表</Text>
            </div>
            <div style={{ overflow: 'auto', flex: 1, padding: NODE_LIST_CONTENT_PADDING }}>
                <div style={{ padding: '4px 0' }}>
                    {rows.map((item) => {
                        const isSelected = node?.id === item.node.id;
                        const nodeType = typeof item.node.data?.type === 'string' ? item.node.data.type : '';
                        return (
                            <div
                                key={item.node.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '5px 8px',
                                    paddingLeft: item.depth * NODE_TREE_INDENT_UNIT + ROW_PADDING_LEFT,
                                    cursor: 'pointer',
                                    background: isSelected ? '#e6f7ff' : 'transparent',
                                    borderRadius: 4,
                                    marginBottom: 2,
                                }}
                                onClick={() => onNodeSelect(item.node.id)}
                            >
                                {getStatusIcon(String(item.node.data?.status || ''))}
                                <Text
                                    style={{
                                        marginLeft: 6,
                                        fontSize: 14,
                                        fontWeight: isSelected ? 500 : 400,
                                        color: isSelected ? (nodeTypeConfig[nodeType]?.color || '#333') : '#333',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {getNodeLabel(item.node)}
                                </Text>
                                {renderBranchLabel(item.branchLabel)}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

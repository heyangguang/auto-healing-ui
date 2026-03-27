import React from 'react';
import {
    BranchesOutlined,
    FolderAddOutlined,
    ImportOutlined,
    PlayCircleOutlined,
    ScheduleOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import { Button, Card } from 'antd';

type WorkbenchQuickActionsCardProps = {
    canCreateFlow: boolean;
    canCreateGitRepo: boolean;
    canExecuteTask: boolean;
    canImportPlaybook: boolean;
    canViewPendingCenter: boolean;
    onCreateFlow: () => void;
    onCreateRepo: () => void;
    onExecuteTask: () => void;
    onImportPlaybook: () => void;
    onOpenPendingCenter: () => void;
    styles: Record<string, string>;
};

const WorkbenchQuickActionsCard: React.FC<WorkbenchQuickActionsCardProps> = ({
    canCreateFlow,
    canCreateGitRepo,
    canExecuteTask,
    canImportPlaybook,
    canViewPendingCenter,
    onCreateFlow,
    onCreateRepo,
    onExecuteTask,
    onImportPlaybook,
    onOpenPendingCenter,
    styles,
}) => (
    <Card id="tour-quick-actions" className={styles.card} styles={{ body: { padding: 0 } }}>
        <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
                <ThunderboltOutlined className={styles.cardTitleIcon} /> 快速操作
            </span>
        </div>
        <div className={styles.cardBody} style={{ padding: '4px 12px' }}>
            <Button className={styles.actionBtn} icon={<ScheduleOutlined />} block disabled={!canViewPendingCenter} onClick={onOpenPendingCenter}>
                待办中心
            </Button>
            <Button className={styles.actionBtn} icon={<FolderAddOutlined />} block disabled={!canCreateGitRepo} onClick={onCreateRepo}>
                添加仓库
            </Button>
            <Button className={styles.actionBtn} icon={<ImportOutlined />} block disabled={!canImportPlaybook} onClick={onImportPlaybook}>
                导入剧本
            </Button>
            <Button className={styles.actionBtn} icon={<PlayCircleOutlined />} block disabled={!canExecuteTask} onClick={onExecuteTask}>
                执行任务
            </Button>
            <Button className={styles.actionBtn} icon={<BranchesOutlined />} block disabled={!canCreateFlow} onClick={onCreateFlow}>
                新建流程
            </Button>
        </div>
    </Card>
);

export default WorkbenchQuickActionsCard;

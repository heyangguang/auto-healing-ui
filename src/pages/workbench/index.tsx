import React, { Suspense, lazy, useCallback, useState } from 'react';
import { history, useAccess, useModel } from '@umijs/max';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { GUIDE_ARTICLES, type GuideArticle } from '@/pages/guide/guideData';
import { canAccessPath } from '@/utils/pathAccess';
import { getPendingHomePath } from '@/utils/pendingPath';
import WorkbenchAnnouncementsCard from './WorkbenchAnnouncementsCard';
import WorkbenchChangeLogCard from './WorkbenchChangeLogCard';
import WorkbenchFavoritesCard from './WorkbenchFavoritesCard';
import WorkbenchGuideCard from './WorkbenchGuideCard';
import WorkbenchMetricsRow from './WorkbenchMetricsRow';
import WorkbenchPendingApprovalsCard from './WorkbenchPendingApprovalsCard';
import { useWorkbenchData } from './useWorkbenchData';
import {
    buildPlatformStats,
    formatRelativeTime,
    formatUptime,
    mergeScheduleTasks,
    resolveFavoriteIcon,
} from './workbenchPageHelpers';
import { useWorkbenchPageStyles } from './workbenchPageStyles';
import WorkbenchQuickActionsCard from './WorkbenchQuickActionsCard';
import WorkbenchResourceOverviewCard from './WorkbenchResourceOverviewCard';
import WorkbenchScheduleCard from './WorkbenchScheduleCard';
import WorkbenchSystemHealthCard from './WorkbenchSystemHealthCard';
import WorkbenchUserCard from './WorkbenchUserCard';

const GuideDrawer = lazy(() => import('./GuideDrawer'));

const WorkbenchPage: React.FC = () => {
    const { styles } = useWorkbenchPageStyles();
    const access = useAccess();
    const { initialState } = useModel('@@initialState');
    const user = initialState?.currentUser;
    const displayName = user?.name || (user as any)?.display_name || (user as any)?.username || '用户';
    const seed = (user as any)?.username || displayName;
    const role = user?.is_platform_admin
        ? '平台管理员'
        : (user as any)?.roles?.[0]?.display_name || (user as any)?.roles?.[0]?.name || '普通用户';
    const [guideDrawerOpen, setGuideDrawerOpen] = useState(false);
    const [guideDrawerArticle, setGuideDrawerArticle] = useState<GuideArticle | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(() => dayjs().format('YYYY-MM-DD'));
    const [calendarMonth, setCalendarMonth] = useState<Dayjs>(dayjs());

    const {
        announcements,
        auditLogs,
        favorites,
        handleCalendarMonthChange,
        loadErrors,
        loading,
        overview,
        pendingApprovals,
        scheduleData,
    } = useWorkbenchData({
        canViewAuditLogs: !!access.canViewAuditLogs,
        canViewApprovals: !!access.canViewApprovals,
        canViewPendingTrigger: !!access.canViewPendingTrigger,
        canViewTasks: !!access.canViewTasks,
    });

    const handleCalendarMonthChangeWithState = useCallback(async (date: Dayjs) => {
        setCalendarMonth(date);
        await handleCalendarMonthChange(date);
    }, [handleCalendarMonthChange]);

    const pendingCenterPath = getPendingHomePath(access);
    const platformStats = buildPlatformStats(
        overview?.resource_overview,
        access as Record<string, unknown>,
    );

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {loadErrors.length > 0 && (
                    <div
                        role="alert"
                        style={{
                            marginBottom: 16,
                            padding: '12px 16px',
                            border: '1px solid #ffd591',
                            borderRadius: 8,
                            background: '#fff7e6',
                            color: '#ad4e00',
                            fontSize: 13,
                        }}
                    >
                        {`部分工作台数据加载失败：${loadErrors.map((item) => item.message).join('、')}`}
                    </div>
                )}
                <div className={styles.leftCol}>
                    <div id="tour-overview" className={styles.topRow}>
                        <WorkbenchSystemHealthCard
                            formatUptime={formatUptime}
                            loading={loading}
                            overview={overview}
                            styles={styles}
                        />
                        <WorkbenchPendingApprovalsCard
                            canViewApprovals={!!access.canViewApprovals}
                            canViewPendingCenter={!!access.canViewPendingCenter}
                            canViewPendingTrigger={!!access.canViewPendingTrigger}
                            loading={loading}
                            onOpenPendingCenter={() => history.push(pendingCenterPath)}
                            pendingApprovals={{
                                total: pendingApprovals.total,
                                items: pendingApprovals.items.map((item) => ({
                                    ...item,
                                    created_at: item.created_at ? formatRelativeTime(item.created_at) : '',
                                })),
                            }}
                            pendingCenterPath={pendingCenterPath}
                            styles={styles}
                        />
                    </div>

                    <WorkbenchFavoritesCard
                        favorites={favorites}
                        isPathAccessible={(path) => canAccessPath(path, access)}
                        loading={loading}
                        onSelectPath={(path) => history.push(path)}
                        resolveFavoriteIcon={resolveFavoriteIcon}
                        styles={styles}
                    />

                    <WorkbenchMetricsRow loading={loading} overview={overview} styles={styles} />

                    <WorkbenchResourceOverviewCard
                        loading={loading}
                        onSelectPath={(path) => history.push(path)}
                        platformStats={platformStats}
                        styles={styles}
                    />

                    <div className={styles.flowRuleRow}>
                        <WorkbenchChangeLogCard
                            auditLogs={auditLogs}
                            canViewAuditLogs={!!access.canViewAuditLogs}
                            formatRelativeTime={formatRelativeTime}
                            loading={loading}
                            onOpenAuditLogs={() => history.push('/system/audit-logs')}
                            styles={styles}
                        />
                        <WorkbenchGuideCard
                            guides={GUIDE_ARTICLES.filter((guide) => guide.category === 'quick')}
                            onOpenGuide={(guide) => {
                                setGuideDrawerArticle(guide);
                                setGuideDrawerOpen(true);
                            }}
                            onViewAll={() => history.push('/guide')}
                            styles={styles}
                        />
                    </div>
                </div>

                <div className={styles.rightCol}>
                    <WorkbenchQuickActionsCard
                        canCreateFlow={!!access.canCreateFlow}
                        canCreateGitRepo={!!access.canCreateGitRepo}
                        canExecuteTask={!!access.canExecuteTask}
                        canImportPlaybook={!!access.canImportPlaybook}
                        canViewPendingCenter={!!access.canViewPendingCenter}
                        onCreateFlow={() => history.push('/healing/flows/editor')}
                        onCreateRepo={() => history.push('/execution/git-repos/create')}
                        onExecuteTask={() => history.push('/execution/execute')}
                        onImportPlaybook={() => history.push('/execution/playbooks/import')}
                        onOpenPendingCenter={() => history.push(pendingCenterPath)}
                        styles={styles}
                    />
                    <WorkbenchUserCard displayName={displayName} role={role} seed={seed} styles={styles} />
                    <WorkbenchAnnouncementsCard
                        announcements={announcements}
                        canViewSiteMessages={!!access.canViewSiteMessages}
                        onOpenMessages={() => history.push('/system/messages')}
                        styles={styles}
                    />
                    <WorkbenchScheduleCard
                        accessDisabled={!access.canViewTasks}
                        calendarMonth={calendarMonth}
                        mergeScheduleTasks={mergeScheduleTasks}
                        onMonthChange={handleCalendarMonthChangeWithState}
                        onOpenSchedules={() => history.push('/execution/schedules')}
                        onSelectDate={setSelectedDate}
                        scheduleData={scheduleData}
                        selectedDate={selectedDate}
                        styles={styles}
                    />
                </div>
            </div>

            <Suspense fallback={null}>
                <GuideDrawer
                    open={guideDrawerOpen}
                    article={guideDrawerArticle}
                    onClose={() => setGuideDrawerOpen(false)}
                />
            </Suspense>
        </div>
    );
};

export default WorkbenchPage;

import React from 'react';
import { history, useModel } from '@umijs/max';
import {
    CheckCircleOutlined,
    WarningOutlined,
    FileTextOutlined,
    PlusOutlined,
    PlayCircleOutlined,
    ReadOutlined,
    BugOutlined,
    DashboardOutlined,
    DatabaseOutlined,
    ToolOutlined,
    ThunderboltOutlined,
    BellOutlined,
    KeyOutlined,
    UserOutlined,
    SafetyCertificateOutlined,
    CloudServerOutlined,
    AppstoreOutlined,
} from '@ant-design/icons';
import { Button, Card, Tag, Avatar } from 'antd';
import { createStyles } from 'antd-style';

/* ──── 快捷入口数据 ──── */
const services = [
    { key: 'cmdb', label: '资产管理', icon: <DatabaseOutlined />, path: '/cmdb' },
    { key: 'rules', label: '自愈规则', icon: <ToolOutlined />, path: '/healing/rules' },
    { key: 'exec', label: '执行管理', icon: <ThunderboltOutlined />, path: '/execution' },
    { key: 'playbook', label: 'Playbook', icon: <ReadOutlined />, path: '/execution/playbooks' },
    { key: 'notify', label: '通知模板', icon: <BellOutlined />, path: '/notification/templates' },
    { key: 'secrets', label: '密钥管理', icon: <KeyOutlined />, path: '/resources/secrets' },
    { key: 'users', label: '用户管理', icon: <UserOutlined />, path: '/system/users' },
    { key: 'roles', label: '角色权限', icon: <SafetyCertificateOutlined />, path: '/system/roles' },
];

/* ──── 样式 ──── */
const useStyles = createStyles(({ token }) => ({
    page: {
        padding: 24,
        background: '#f4f5f7',
        minHeight: 'calc(100vh - 48px)',
    },
    container: {
        maxWidth: 1600,
        margin: '0 auto',
        display: 'flex',
        gap: 24,
    },
    leftCol: {
        flex: 3,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 20,
        minWidth: 0,
    },
    rightCol: {
        flex: 1,
        minWidth: 280,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 20,
    },
    // 卡片
    card: {
        boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
    },
    cardHeader: {
        padding: '14px 20px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: 600,
        color: '#595959',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    cardTitleIcon: {
        fontSize: 16,
        color: '#8c8c8c',
    },
    cardLink: {
        fontSize: 12,
        color: token.colorPrimary,
        cursor: 'pointer',
        '&:hover': {
            textDecoration: 'underline',
        },
    },
    cardBody: {
        padding: 20,
    },
    // 顶部行
    topRow: {
        display: 'flex',
        gap: 20,
    },
    // 健康状态
    healthCenter: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        height: 140,
        gap: 8,
    },
    healthIcon: {
        fontSize: 48,
        color: token.colorSuccess || '#52c41a',
    },
    healthTitle: {
        fontSize: 20,
        fontWeight: 600,
        color: '#262626',
    },
    healthSub: {
        fontSize: 12,
        color: '#8c8c8c',
    },
    // 待办
    approvalItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        marginBottom: 8,
        background: '#fffbf0',
    },
    approvalItemBlue: {
        background: '#f0f7ff',
    },
    approvalInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flex: 1,
        minWidth: 0,
    },
    approvalText: {
        fontSize: 13,
        color: '#262626',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    },
    // 快捷入口网格
    serviceGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
    },
    serviceItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        border: '1px solid #f0f0f0',
        cursor: 'pointer',
        transition: 'all 0.15s',
        '&:hover': {
            background: '#fafafa',
            borderColor: '#e8e8e8',
        },
    },
    serviceIcon: {
        fontSize: 18,
        color: '#8c8c8c',
    },
    serviceLabel: {
        fontSize: 13,
        fontWeight: 500,
        color: '#262626',
    },
    // 指标行
    metricsRow: {
        display: 'flex',
        gap: 20,
    },
    metricCenter: {
        display: 'flex',
        justifyContent: 'space-around',
        padding: '16px 0',
    },
    metricValue: {
        textAlign: 'center' as const,
    },
    metricNumber: {
        fontSize: 28,
        fontWeight: 600,
        lineHeight: '36px',
    },
    metricLabel: {
        fontSize: 12,
        color: '#8c8c8c',
        marginTop: 4,
    },
    // 右侧卡片
    actionBtn: {
        width: '100%',
        justifyContent: 'flex-start',
        marginBottom: 8,
    },
    userHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
    },
    userName: {
        fontSize: 15,
        fontWeight: 600,
        color: '#262626',
    },
    userRole: {
        fontSize: 12,
        color: '#8c8c8c',
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 8,
        fontSize: 13,
    },
    infoLabel: {
        color: '#8c8c8c',
    },
    infoValue: {
        fontWeight: 500,
        color: '#262626',
    },
    announcement: {
        marginBottom: 12,
    },
    announcementTitle: {
        fontSize: 13,
        fontWeight: 500,
        color: '#262626',
        cursor: 'pointer',
        '&:hover': {
            color: token.colorPrimary,
        },
    },
    announcementDate: {
        fontSize: 12,
        color: '#bfbfbf',
        marginTop: 2,
    },
}));

const WorkbenchPage: React.FC = () => {
    const { styles, cx } = useStyles();
    const { initialState } = useModel('@@initialState');
    const user = initialState?.currentUser;
    const displayName = user?.name || (user as any)?.display_name || (user as any)?.username || '用户';
    const firstChar = displayName.charAt(0).toUpperCase();
    const role = (user as any)?.access === 'admin' ? '系统管理员' : '普通用户';

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                {/* ══════ 左栏（主操作区） ══════ */}
                <div className={styles.leftCol}>

                    {/* 顶部行：系统状态 + 待办 */}
                    <div className={styles.topRow}>
                        <Card className={styles.card} style={{ flex: 1, minHeight: 200 }} bodyStyle={{ padding: 0 }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>系统健康状态</span>
                                <Tag color="success" style={{ margin: 0, fontSize: 10, height: 20, lineHeight: '20px' }}>运行中</Tag>
                            </div>
                            <div className={cx(styles.cardBody, styles.healthCenter)}>
                                <CheckCircleOutlined className={styles.healthIcon} />
                                <span className={styles.healthTitle}>系统运行正常</span>
                                <span className={styles.healthSub}>所有核心组件在线</span>
                            </div>
                        </Card>

                        <Card className={styles.card} style={{ flex: 1, minHeight: 200 }} bodyStyle={{ padding: 0 }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>待办审批</span>
                                <span className={styles.cardLink} onClick={() => history.push('/pending-center')}>查看全部 &gt;</span>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.approvalItem}>
                                    <div className={styles.approvalInfo}>
                                        <WarningOutlined style={{ color: '#faad14', fontSize: 14 }} />
                                        <span className={styles.approvalText}>生产环境变更审批 #1024</span>
                                    </div>
                                    <Button size="small" type="link">审批</Button>
                                </div>
                                <div className={cx(styles.approvalItem, styles.approvalItemBlue)}>
                                    <div className={styles.approvalInfo}>
                                        <FileTextOutlined style={{ color: '#1677ff', fontSize: 14 }} />
                                        <span className={styles.approvalText}>权限申请 #1025</span>
                                    </div>
                                    <Button size="small" type="link">查看</Button>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* 快捷入口 */}
                    <Card className={styles.card} bodyStyle={{ padding: 0 }}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>快捷入口</span>
                        </div>
                        <div className={styles.cardBody}>
                            <div className={styles.serviceGrid}>
                                {services.map((svc) => (
                                    <div
                                        key={svc.key}
                                        className={styles.serviceItem}
                                        onClick={() => history.push(svc.path)}
                                    >
                                        <span className={styles.serviceIcon}>{svc.icon}</span>
                                        <span className={styles.serviceLabel}>{svc.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* 指标行 */}
                    <div className={styles.metricsRow}>
                        <Card className={styles.card} style={{ flex: 1 }} bodyStyle={{ padding: 0 }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>
                                    <BugOutlined className={styles.cardTitleIcon} /> 自愈执行
                                </span>
                            </div>
                            <div className={cx(styles.cardBody, styles.metricCenter)}>
                                <div className={styles.metricValue}>
                                    <div className={styles.metricNumber} style={{ color: '#52c41a' }}>12</div>
                                    <div className={styles.metricLabel}>今日成功</div>
                                </div>
                                <div className={styles.metricValue}>
                                    <div className={styles.metricNumber} style={{ color: '#ff4d4f' }}>1</div>
                                    <div className={styles.metricLabel}>今日失败</div>
                                </div>
                            </div>
                        </Card>

                        <Card className={styles.card} style={{ flex: 1 }} bodyStyle={{ padding: 0 }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>
                                    <WarningOutlined className={styles.cardTitleIcon} /> 告警统计
                                </span>
                            </div>
                            <div className={cx(styles.cardBody, styles.metricCenter)}>
                                <div className={styles.metricValue}>
                                    <div className={styles.metricNumber} style={{ color: '#ff4d4f' }}>3</div>
                                    <div className={styles.metricLabel}>活跃告警</div>
                                </div>
                                <div className={styles.metricValue}>
                                    <div className={styles.metricNumber} style={{ color: '#262626' }}>45</div>
                                    <div className={styles.metricLabel}>近 7 天总计</div>
                                </div>
                            </div>
                        </Card>

                        <Card className={styles.card} style={{ flex: 1 }} bodyStyle={{ padding: 0 }}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardTitle}>
                                    <CloudServerOutlined className={styles.cardTitleIcon} /> 纳管主机
                                </span>
                            </div>
                            <div className={cx(styles.cardBody, styles.metricCenter)}>
                                <div className={styles.metricValue}>
                                    <div className={styles.metricNumber} style={{ color: '#1677ff' }}>145</div>
                                    <div className={styles.metricLabel}>在线主机</div>
                                </div>
                                <div className={styles.metricValue}>
                                    <div className={styles.metricNumber} style={{ color: '#bfbfbf' }}>3</div>
                                    <div className={styles.metricLabel}>离线</div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* ══════ 右栏（系统信息） ══════ */}
                <div className={styles.rightCol}>
                    {/* 快速操作 */}
                    <Card className={styles.card} bodyStyle={{ padding: 16 }}>
                        <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>快速操作</div>
                        <Button
                            className={styles.actionBtn}
                            icon={<PlusOutlined />}
                            block
                            onClick={() => history.push('/incidents')}
                        >
                            新建工单
                        </Button>
                        <Button
                            className={styles.actionBtn}
                            icon={<PlayCircleOutlined />}
                            block
                            onClick={() => history.push('/execution/execute')}
                        >
                            执行剧本
                        </Button>
                        <Button
                            className={styles.actionBtn}
                            icon={<ReadOutlined />}
                            block
                            onClick={() => window.open('https://pro.ant.design/docs/getting-started', '_blank')}
                        >
                            查看文档
                        </Button>
                    </Card>

                    {/* 用户信息 */}
                    <Card className={styles.card} bodyStyle={{ padding: 20 }}>
                        <div className={styles.userHeader}>
                            <Avatar size={48} style={{ background: '#0f62fe', fontWeight: 600 }}>{firstChar}</Avatar>
                            <div>
                                <div className={styles.userName}>{displayName}</div>
                                <div className={styles.userRole}><Tag color="blue" style={{ margin: 0, fontSize: 11 }}>{role}</Tag></div>
                            </div>
                        </div>
                    </Card>

                    {/* 系统信息 */}
                    <Card className={styles.card} bodyStyle={{ padding: 20 }}>
                        <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>系统信息</div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>版本</span>
                            <span className={styles.infoValue}>v2.5.0</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>运行时间</span>
                            <span className={styles.infoValue}>12天 4小时</span>
                        </div>
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>环境</span>
                            <Tag color="green" style={{ margin: 0, fontSize: 11 }}>Production</Tag>
                        </div>
                    </Card>

                    {/* 系统公告 */}
                    <Card className={styles.card} style={{ flex: 1 }} bodyStyle={{ padding: 0 }}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardTitle}>系统公告</span>
                        </div>
                        <div className={styles.cardBody}>
                            <div className={styles.announcement}>
                                <div className={styles.announcementTitle}>v2.5.0 版本发布更新说明</div>
                                <div className={styles.announcementDate}>2026-02-12</div>
                            </div>
                            <div className={styles.announcement}>
                                <div className={styles.announcementTitle}>系统维护计划通知</div>
                                <div className={styles.announcementDate}>2026-02-10</div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default WorkbenchPage;

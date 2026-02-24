/**
 * 全站导航数据 — 从 config/routes.ts 自动构建
 *
 * ⚠️  本文件是只读逻辑，一般不需要修改。
 *     新增或修改菜单请直接编辑 config/routes.ts 的导航元数据字段。
 */
import React from 'react';
import {
    DashboardOutlined,
    ToolOutlined,
    ThunderboltOutlined,
    DatabaseOutlined,
    AlertOutlined,
    BellOutlined,
    SettingOutlined,
    KeyOutlined,
    AppstoreOutlined,
    CarryOutOutlined,
    SafetyCertificateOutlined,
    ApartmentOutlined,
    PlayCircleOutlined,
    CodeOutlined,
    BookOutlined,
    FileTextOutlined,
    ReadOutlined,
    ScheduleOutlined,
    HistoryOutlined,
    MailOutlined,
    UserOutlined,
    LockOutlined,
    AuditOutlined,
    ClusterOutlined,
    TeamOutlined,
    GlobalOutlined,
    ControlOutlined,
    FundProjectionScreenOutlined,
    SolutionOutlined,
    MessageOutlined,
    EyeOutlined,
    UserSwitchOutlined,
    BarChartOutlined,
    StopOutlined,
} from '@ant-design/icons';
import routes from '../../config/routes';

/* ──── 图标映射（string → React Node） ──── */
const ICON_MAP: Record<string, React.ReactNode> = {
    dashboard: <DashboardOutlined />,
    tool: <ToolOutlined />,
    thunderbolt: <ThunderboltOutlined />,
    database: <DatabaseOutlined />,
    alert: <AlertOutlined />,
    bell: <BellOutlined />,
    setting: <SettingOutlined />,
    key: <KeyOutlined />,
    appstore: <AppstoreOutlined />,
    carryOut: <CarryOutOutlined />,
    safetyCertificate: <SafetyCertificateOutlined />,
    apartment: <ApartmentOutlined />,
    playCircle: <PlayCircleOutlined />,
    code: <CodeOutlined />,
    book: <BookOutlined />,
    fileText: <FileTextOutlined />,
    read: <ReadOutlined />,
    schedule: <ScheduleOutlined />,
    history: <HistoryOutlined />,
    mail: <MailOutlined />,
    user: <UserOutlined />,
    lock: <LockOutlined />,
    audit: <AuditOutlined />,
    cluster: <ClusterOutlined />,
    team: <TeamOutlined />,
    global: <GlobalOutlined />,
    control: <ControlOutlined />,
    fundProjectionScreen: <FundProjectionScreenOutlined />,
    solution: <SolutionOutlined />,
    message: <MessageOutlined />,
    eye: <EyeOutlined />,
    userSwitch: <UserSwitchOutlined />,
    barChart: <BarChartOutlined />,
    home: <DashboardOutlined />,
    stop: <StopOutlined />,
};

/* ──── 类型定义 ──── */
export interface Category {
    id: string;
    label: string;
    icon: React.ReactNode;
}

export interface ServiceItem {
    id: string;
    name: string;
    path: string;
    desc?: string;
    icon?: React.ReactNode;
    /** access.ts 中的权限变量名，用于菜单可见性过滤 */
    access?: string;
}

/* ──── 分类排序优先级 ──── */
const CATEGORY_ORDER = [
    'dashboard', 'assets', 'execution', 'healing',
    'notification', 'pending', 'security', 'system', 'platform', 'guide',
];

/* ──── 从 routes 构建 CATEGORIES 和 SERVICES ──── */
function buildNavData(): { categories: Category[]; services: Record<string, ServiceItem[]> } {
    const categoriesMap = new Map<string, Category>();
    const services: Record<string, ServiceItem[]> = {};

    for (const route of routes as any[]) {
        const catId = route.categoryId;
        if (!catId) continue;

        // 注册分类
        if (!categoriesMap.has(catId)) {
            const catIcon = route.icon || route.navIcon;
            categoriesMap.set(catId, {
                id: catId,
                label: route.categoryLabel || route.name || catId,
                icon: ICON_MAP[catIcon] || <AppstoreOutlined />,
            });
        }

        // 处理子路由 → ServiceItems
        if (route.routes) {
            const items: ServiceItem[] = [];
            for (const child of route.routes) {
                // 跳过 redirect、hideInMenu、无 label 的路由
                if (child.redirect || child.hideInMenu || !child.label) continue;
                items.push({
                    id: child.name || child.path,
                    name: child.label,
                    path: child.path,
                    desc: child.desc,
                    icon: child.navIcon ? ICON_MAP[child.navIcon] : undefined,
                    access: child.navAccess,
                });
            }
            if (items.length > 0) {
                services[catId] = items;
            }
        } else if (route.label) {
            // 无子路由的模块（如 dashboard）
            services[catId] = [{
                id: route.name || route.path,
                name: route.label,
                path: route.path,
                desc: route.desc,
                icon: route.navIcon ? ICON_MAP[route.navIcon] : undefined,
                access: route.navAccess || route.access,
            }];
        }
    }

    // 按优先级排序
    const categories = CATEGORY_ORDER
        .filter(id => categoriesMap.has(id))
        .map(id => categoriesMap.get(id)!);

    // 加入未列在优先级中的分类
    for (const [id, cat] of categoriesMap) {
        if (!CATEGORY_ORDER.includes(id)) {
            categories.push(cat);
        }
    }

    return { categories, services };
}

const { categories, services } = buildNavData();

export const CATEGORIES: Category[] = categories;
export const SERVICES: Record<string, ServiceItem[]> = services;

/* ──── 根据路径查找菜单项（用于记录最近访问） ──── */
export function findServiceByPath(pathname: string): ServiceItem | null {
    for (const items of Object.values(SERVICES)) {
        const match = items.find(
            (item) => pathname === item.path || pathname.startsWith(item.path + '/'),
        );
        if (match) return match;
    }
    return null;
}

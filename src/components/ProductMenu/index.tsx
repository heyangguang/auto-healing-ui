import React, { useState, useEffect, useCallback, startTransition } from 'react';
import {
    CloseOutlined,
    StarFilled,
    StarOutlined,
    ClockCircleOutlined,
    LoadingOutlined,
    ReadOutlined,
} from '@ant-design/icons';
import { history, useAccess } from '@umijs/max';
import { Drawer, message, Tooltip } from 'antd';
import { CATEGORIES, SERVICES, type ServiceItem } from '@/config/navData';
import {
    getFavorites,
    addFavorite,
    removeFavorite,
    getRecents,
    type FavoriteItem,
    type RecentItem,
} from '@/services/auto-healing/userNav';
import { canAccessPath } from '@/utils/pathAccess';
import type accessFactory from '@/access';
import { resolveActiveCategoryId } from './productMenuState';
import { useProductMenuStyles } from './productMenuStyles';

type AppAccess = ReturnType<typeof accessFactory>;

/* ──── 组件 ──── */
interface ProductMenuProps {
    open: boolean;
    onClose: () => void;
}

const ProductMenu: React.FC<ProductMenuProps> = ({ open, onClose }) => {
    const { styles, cx } = useProductMenuStyles();
    const access = useAccess() as AppAccess;
    const [activeCategory, setActiveCategory] = useState('healing');

    // API 数据
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [recents, setRecents] = useState<RecentItem[]>([]);
    const [loadingFav, setLoadingFav] = useState(false);
    const [togglingKey, setTogglingKey] = useState<string | null>(null);

    // 打开时加载数据
    useEffect(() => {
        if (!open) return;
        setLoadingFav(true);
        Promise.all([
            getFavorites().then((items) => setFavorites(items || [])),
            getRecents().then((items) => setRecents(items || [])),
        ]).finally(() => setLoadingFav(false));
    }, [open]);

    // 收藏 set 用于快速查找
    const favKeySet = new Set(favorites.map((f) => f.menu_key));

    // 切换收藏
    const toggleFavorite = useCallback(
        async (menuKey: string, name: string, path: string, e: React.MouseEvent) => {
            e.stopPropagation();
            if (togglingKey) return;
            setTogglingKey(menuKey);
            try {
                if (favKeySet.has(menuKey)) {
                    await removeFavorite(menuKey);
                    setFavorites((prev) => prev.filter((f) => f.menu_key !== menuKey));
                    message.success('已取消收藏');
                } else {
                    const item = await addFavorite({ menu_key: menuKey, name, path });
                    if (item) {
                        setFavorites((prev) => [...prev, item]);
                    }
                    message.success('已添加收藏');
                }
            } catch {
                message.error('操作失败');
            } finally {
                setTogglingKey(null);
            }
        },
        [togglingKey, favKeySet],
    );

    const handleNavigate = (path: string) => {
        if (!canAccessPath(path, access)) return;
        startTransition(() => {
            history.push(path);
        });
        onClose();
    };

    const hasServiceAccess = useCallback((svc: ServiceItem) => {
        if (svc.accesses?.length) {
            return svc.accesses.every((key) => {
                if (!key) {
                    return true;
                }
                const accessValue = access[key as keyof AppAccess];
                return typeof accessValue === 'boolean' ? accessValue : Boolean(accessValue);
            });
        }
        if (svc.access) {
            const accessValue = access[svc.access as keyof AppAccess];
            return typeof accessValue === 'boolean' ? accessValue : Boolean(accessValue);
        }
        return canAccessPath(svc.path, access);
    }, [access]);

    // 根据权限过滤服务和分类
    const filteredServices = React.useMemo(() => {
        const result: Record<string, ServiceItem[]> = {};
        for (const [catId, items] of Object.entries(SERVICES)) {
            const filtered = items.filter(hasServiceAccess);
            if (filtered.length > 0) result[catId] = filtered;
        }
        return result;
    }, [hasServiceAccess]);

    const filteredCategories = React.useMemo(() => {
        return CATEGORIES.filter(cat => cat.id === 'guide' || filteredServices[cat.id]?.length > 0);
    }, [filteredServices]);

    useEffect(() => {
        if (!open) {
            return;
        }
        const nextCategoryId = resolveActiveCategoryId(filteredCategories, activeCategory);
        if (nextCategoryId && nextCategoryId !== activeCategory) {
            setActiveCategory(nextCategoryId);
        }
    }, [activeCategory, filteredCategories, open]);

    const activeCat = filteredCategories.find((c) => c.id === activeCategory);
    const services = filteredServices[activeCategory] || [];

    return (
        <Drawer
            open={open}
            onClose={onClose}
            placement="left"
            size={800}
            closable={false}
            mask={true}
            styles={{
                body: { display: 'flex', padding: 0, height: '100%' },
                wrapper: { maxWidth: '90vw' },
                mask: { position: 'fixed', top: 58, left: 0, right: 0, bottom: 0, width: '100vw', height: 'calc(100vh - 58px)' },
            }}
            rootStyle={{ zIndex: 1002, position: 'fixed', top: 58, left: 0, right: 0, bottom: 0, width: '100vw', height: 'calc(100vh - 58px)' }}
        >
            {/* 左侧分类面板 */}
            <div className={styles.leftPanel}>
                <div className={styles.catList}>
                    {filteredCategories.filter(cat => cat.id !== 'guide').map((cat) => (
                        <div
                            key={cat.id}
                            className={cx(styles.catItem, activeCategory === cat.id && styles.catItemActive)}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            <span className={styles.catIcon}>{cat.icon}</span>
                            <span>{cat.label}</span>
                        </div>
                    ))}
                </div>
                <div className={styles.guideBottom}>
                    <div
                        className={styles.catItem}
                        onClick={() => handleNavigate('/guide')}
                    >
                        <span className={styles.catIcon}><ReadOutlined /></span>
                        <span>产品指南</span>
                    </div>
                </div>
            </div>

            {/* 右侧内容面板 */}
            <div className={styles.rightPanel}>
                {/* 顶部 Header */}
                <div className={styles.header}>
                    <span className={styles.headerTitle}>全站导航</span>
                    <div className={styles.closeBtn} onClick={onClose}>
                        <CloseOutlined />
                    </div>
                </div>

                {/* 收藏 & 最近 */}
                <div className={styles.quickArea}>
                    <div className={styles.quickSection}>
                        <div className={styles.quickLabel}>
                            <StarFilled className={styles.quickLabelIcon} style={{ color: '#faad14' }} />
                            我的收藏
                            {loadingFav && <LoadingOutlined style={{ fontSize: 12, marginLeft: 4 }} />}
                        </div>
                        <div className={styles.quickLinks}>
                            {favorites.length > 0 ? (
                                favorites.slice(0, 6).map((f) => (
                                    <span
                                        key={f.menu_key}
                                        className={styles.quickLink}
                                        style={!canAccessPath(f.path, access) ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                                        onClick={() => handleNavigate(f.path)}
                                    >
                                        {f.name}
                                    </span>
                                ))
                            ) : (
                                !loadingFav && <span className={styles.emptyHint}>点击服务卡片上的 ★ 添加收藏</span>
                            )}
                        </div>
                    </div>
                    <div className={styles.quickSection}>
                        <div className={styles.quickLabel}>
                            <ClockCircleOutlined className={styles.quickLabelIcon} />
                            最近访问
                        </div>
                        <div className={styles.quickLinks}>
                            {recents.length > 0 ? (
                                recents.slice(0, 6).map((r) => (
                                    <span
                                        key={r.menu_key}
                                        className={styles.quickLink}
                                        style={!canAccessPath(r.path, access) ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                                        onClick={() => handleNavigate(r.path)}
                                    >
                                        {r.name}
                                    </span>
                                ))
                            ) : (
                                !loadingFav && <span className={styles.emptyHint}>浏览页面后自动记录</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 服务列表 */}
                <div className={styles.serviceArea}>
                    <div className={styles.serviceTitle}>{activeCat?.label}</div>
                    <div className={styles.serviceGrid}>
                        {services.map((svc) => {
                            const isFav = favKeySet.has(svc.id);
                            return (
                                <div
                                    key={svc.id}
                                    className={styles.serviceCard}
                                    onClick={() => handleNavigate(svc.path)}
                                >
                                    {svc.icon && <span className={styles.serviceIcon}>{svc.icon}</span>}
                                    <div style={{ flex: 1 }}>
                                        <div className={styles.serviceName}>{svc.name}</div>
                                        {svc.desc && <div className={styles.serviceDesc}>{svc.desc}</div>}
                                    </div>
                                    <Tooltip title={isFav ? '取消收藏' : '添加收藏'}>
                                        <span
                                            className={cx('fav-star', styles.favStar, isFav && styles.favStarActive)}
                                            onClick={(e) => toggleFavorite(svc.id, svc.name, svc.path, e)}
                                        >
                                            {togglingKey === svc.id ? (
                                                <LoadingOutlined />
                                            ) : isFav ? (
                                                <StarFilled />
                                            ) : (
                                                <StarOutlined />
                                            )}
                                        </span>
                                    </Tooltip>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Drawer>
    );
};

export default ProductMenu;

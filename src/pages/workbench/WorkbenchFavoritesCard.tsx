import React from 'react';
import { AppstoreOutlined } from '@ant-design/icons';
import { Card, Empty, Spin } from 'antd';
import type { FavoriteItem } from '@/services/auto-healing/workbench';

type WorkbenchFavoritesCardProps = {
    favorites: FavoriteItem[];
    isPathAccessible: (path: string) => boolean;
    loading: boolean;
    onSelectPath: (path: string) => void;
    resolveFavoriteIcon: (key: string) => React.ReactNode;
    styles: Record<string, string>;
};

const WorkbenchFavoritesCard: React.FC<WorkbenchFavoritesCardProps> = ({
    favorites,
    isPathAccessible,
    loading,
    onSelectPath,
    resolveFavoriteIcon,
    styles,
}) => (
    <Card id="tour-favorites" className={styles.card} styles={{ body: { padding: 0 } }}>
        <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
                <AppstoreOutlined className={styles.cardTitleIcon} /> 我的收藏
            </span>
        </div>
        {loading ? (
            <div className={styles.loadingWrap}><Spin /></div>
        ) : favorites.length === 0 ? (
            <div className={styles.cardBody} style={{ padding: '12px 0' }}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无收藏" />
            </div>
        ) : (
            <div className={styles.favGrid}>
                {favorites.map((item) => {
                    const disabled = !isPathAccessible(item.path);
                    return (
                        <button
                            key={item.key}
                            type="button"
                            className={styles.favItem}
                            onClick={() => {
                                if (!disabled) onSelectPath(item.path);
                            }}
                            disabled={disabled}
                            style={disabled ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                        >
                            <span className={styles.favIconWrap} style={{ color: '#1677ff' }}>{resolveFavoriteIcon(item.key)}</span>
                            <span className={styles.favName}>{item.label}</span>
                        </button>
                    );
                })}
            </div>
        )}
    </Card>
);

export default WorkbenchFavoritesCard;

import React from 'react';
import { ReadOutlined, RightOutlined } from '@ant-design/icons';
import { Card } from 'antd';
import type { GuideArticle } from '@/pages/guide/guideData';

type WorkbenchGuideCardProps = {
    guides: GuideArticle[];
    onOpenGuide: (guide: GuideArticle) => void;
    onViewAll: () => void;
    styles: Record<string, string>;
};

const WorkbenchGuideCard: React.FC<WorkbenchGuideCardProps> = ({
    guides,
    onOpenGuide,
    onViewAll,
    styles,
}) => (
    <Card id="tour-quick-guide" className={styles.card} style={{ flex: 1 }} styles={{ body: { padding: 0 } }}>
        <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
                <ReadOutlined className={styles.cardTitleIcon} /> 快速指南
            </span>
            <button type="button" className={styles.cardLinkButton} onClick={onViewAll}>
                查看全部 <RightOutlined style={{ fontSize: 10 }} />
            </button>
        </div>
        <div>
            {guides.map((guide) => (
                <button
                    key={guide.id}
                    type="button"
                    className={styles.guideItem}
                    onClick={() => onOpenGuide(guide)}
                >
                    <div className={styles.guideIcon}>{guide.icon}</div>
                    <div className={styles.guideContent}>
                        <div className={styles.guideTitle}>{guide.title}</div>
                        <div className={styles.guideDesc}>{guide.desc}</div>
                    </div>
                    <RightOutlined style={{ color: '#bfbfbf', fontSize: 12 }} />
                </button>
            ))}
        </div>
    </Card>
);

export default WorkbenchGuideCard;

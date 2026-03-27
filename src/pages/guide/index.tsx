import React, { useEffect, useMemo, useRef, useState } from 'react';
import { history, useAccess, useParams } from '@umijs/max';
import { Empty, Input, Spin } from 'antd';
import {
    ArrowLeftOutlined,
    CheckCircleFilled,
    ReadOutlined,
    RightOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { canAccessPath } from '@/utils/pathAccess';
import {
    GUIDE_ARTICLES,
    GUIDE_CATEGORY_LABELS,
    type GuideArticle,
    type GuideCategory,
} from './guideData';
import { getCorrectedGuidePath, resolveGuideId } from './guideRouteHelpers';
import { useGuidePageStyles } from './guidePageStyles';

const GUIDE_LOAD_ERROR = '> ⚠️ 文档加载失败，请检查文件路径。';

function groupArticles(articles: GuideArticle[]) {
    const order: GuideCategory[] = ['quick', 'module', 'flow'];
    return order
        .map((category) => ({
            category,
            label: GUIDE_CATEGORY_LABELS[category],
            items: articles.filter((article) => article.category === category),
        }))
        .filter((group) => group.items.length > 0);
}

const GuidePage: React.FC = () => {
    const { styles, cx } = useGuidePageStyles();
    const access = useAccess();
    const params = useParams<{ id?: string }>();
    const requestIdRef = useRef(0);
    const [search, setSearch] = useState('');
    const [markdownContent, setMarkdownContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState(() => resolveGuideId(params.id));

    useEffect(() => {
        const nextId = resolveGuideId(params.id);
        const correctedPath = getCorrectedGuidePath(params.id);
        if (correctedPath) {
            history.replace(correctedPath);
        }
        setSelectedId((currentId) => currentId === nextId ? currentId : nextId);
    }, [params.id]);

    const filteredArticles = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) {
            return GUIDE_ARTICLES;
        }
        return GUIDE_ARTICLES.filter((article) => (
            article.title.toLowerCase().includes(query)
            || article.desc.toLowerCase().includes(query)
        ));
    }, [search]);

    const groupedArticles = useMemo(() => groupArticles(filteredArticles), [filteredArticles]);
    const selectedArticle = useMemo(
        () => GUIDE_ARTICLES.find((article) => article.id === selectedId),
        [selectedId],
    );

    useEffect(() => {
        if (!selectedArticle?.markdownFile) {
            setMarkdownContent('');
            return;
        }

        const controller = new AbortController();
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;
        setLoading(true);

        fetch(selectedArticle.markdownFile, { signal: controller.signal })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to load guide markdown');
                }
                return response.text();
            })
            .then((text) => {
                if (requestId !== requestIdRef.current) {
                    return;
                }
                setMarkdownContent(text);
            })
            .catch((error: Error) => {
                if (controller.signal.aborted || requestId !== requestIdRef.current) {
                    return;
                }
                console.error('[Guide] Markdown load failed:', error);
                setMarkdownContent(GUIDE_LOAD_ERROR);
            })
            .finally(() => {
                if (requestId === requestIdRef.current) {
                    setLoading(false);
                }
            });

        return () => {
            controller.abort();
        };
    }, [selectedArticle?.markdownFile]);

    return (
        <div className={styles.page}>
            <div className={styles.sidebar}>
                <div className={styles.sideHeader}>
                    <div className={styles.backBtnWrap}>
                        <div className={styles.backBtn} onClick={() => history.replace('/workbench')}>
                            <ArrowLeftOutlined /> 返回工作台
                        </div>
                    </div>
                    <div className={styles.sideTitle}>
                        <ReadOutlined className={styles.sideIcon} />
                        产品指南
                    </div>
                    <div className={styles.searchWrap}>
                        <Input
                            placeholder="搜索指南..."
                            prefix={<SearchOutlined />}
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            allowClear
                            className={styles.searchInput}
                        />
                    </div>
                </div>

                <div className={styles.articleList}>
                    {groupedArticles.length === 0 ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配结果" style={{ padding: '40px 0' }} />
                    ) : groupedArticles.map((group) => (
                        <React.Fragment key={group.category}>
                            <div className={styles.categoryLabel}>{group.label}</div>
                            {group.items.map((article) => (
                                <div
                                    key={article.id}
                                    className={cx(styles.articleItem, selectedId === article.id && styles.articleItemActive)}
                                    onClick={() => {
                                        setSelectedId(article.id);
                                        history.push(`/guide/${article.id}`);
                                    }}
                                >
                                    <div className={styles.articleIcon}>{article.icon}</div>
                                    <div className={styles.articleInfo}>
                                        <div className={styles.articleName}>{article.title}</div>
                                        <div className={styles.articleDesc}>{article.desc}</div>
                                    </div>
                                    <RightOutlined className={styles.articleArrow} />
                                </div>
                            ))}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div className={styles.contentArea}>
                {!selectedArticle ? (
                    <div className={styles.emptyContent}>
                        <Empty description="请从左侧选择一篇指南" />
                    </div>
                ) : (
                    <>
                        {selectedArticle.steps.length > 0 && (
                            <div className={styles.stepsOverview}>
                                <div className={styles.stepsTitle}>
                                    <CheckCircleFilled style={{ color: '#52c41a' }} />
                                    快速步骤
                                </div>
                                <div className={styles.stepsList}>
                                    {selectedArticle.steps.map((step, index) => {
                                        const allowed = canAccessPath(step.path, access);
                                        return (
                                            <div
                                                key={step.path}
                                                className={styles.stepItem}
                                                onClick={() => allowed && history.push(step.path)}
                                                style={!allowed ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                                            >
                                                <span className={styles.stepNumber}>{index + 1}</span>
                                                <span className={styles.stepText}>{step.title}</span>
                                                <span className={styles.stepGo}>前往 <RightOutlined /></span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {loading ? (
                            <div className={styles.loadingArea}>
                                <Spin tip="加载中..." />
                            </div>
                        ) : (
                            <div className={styles.markdownBody}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {markdownContent}
                                </ReactMarkdown>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default GuidePage;

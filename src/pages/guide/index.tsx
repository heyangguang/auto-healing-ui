/**
 * 独立产品指南页面
 *
 * 路由：/guide 和 /guide/:id
 * 左右两栏布局：左侧文章列表 + 右侧 Markdown 渲染
 */
import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from '@umijs/max';
import { Input, Empty, Spin } from 'antd';
import {
    SearchOutlined,
    RightOutlined,
    ReadOutlined,
    CheckCircleFilled,
    ArrowLeftOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import { createStyles } from 'antd-style';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GUIDE_ARTICLES, GUIDE_CATEGORY_LABELS, type GuideArticle, type GuideCategory } from './guideData';

const useStyles = createStyles(({ token }) => ({
    page: {
        display: 'flex',
        height: 'calc(100vh - 56px)',
        overflow: 'hidden',
        background: '#fff',
    },

    /* ── 左侧文章列表 ── */
    sidebar: {
        width: 320,
        minWidth: 320,
        borderRight: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column' as const,
        background: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)',
    },
    sideHeader: {
        borderBottom: '1px solid #f0f0f0',
    },
    backBtnWrap: {
        padding: '16px 20px',
        borderBottom: '1px solid #f0f0f0',
    },
    sideTitle: {
        fontSize: 18,
        fontWeight: 600,
        color: '#262626',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '16px 20px 0',
        marginBottom: 16,
    },
    backBtn: {
        fontSize: 14,
        color: '#8c8c8c',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        '&:hover': { color: token.colorPrimary },
    },
    searchWrap: {
        padding: '0 20px 16px',
    },
    sideIcon: {
        fontSize: 18,
        color: token.colorPrimary,
    },
    searchInput: {
        '.ant-input-prefix': {
            color: '#bfbfbf',
        },
    },
    articleList: {
        flex: 1,
        overflowY: 'auto' as const,
        padding: '8px 0',
    },
    categoryLabel: {
        fontSize: 11,
        fontWeight: 700,
        color: '#8c8c8c',
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
        padding: '16px 20px 6px',
    },
    articleItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 20px',
        cursor: 'pointer',
        borderLeft: '3px solid transparent',
        transition: 'all 0.15s',
        '&:hover': {
            background: 'rgba(24,144,255,0.04)',
        },
    },
    articleItemActive: {
        background: '#f0f7ff',
        borderLeft: `3px solid ${token.colorPrimary}`,
    },
    articleIcon: {
        width: 36,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#e6f4ff',
        color: token.colorPrimary,
        fontSize: 16,
        flexShrink: 0,
    },
    articleInfo: {
        flex: 1,
        minWidth: 0,
    },
    articleName: {
        fontSize: 14,
        fontWeight: 500,
        color: '#262626',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    },
    articleDesc: {
        fontSize: 12,
        color: '#8c8c8c',
        marginTop: 2,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    },
    articleArrow: {
        fontSize: 11,
        color: '#d9d9d9',
        flexShrink: 0,
    },

    /* ── 右侧内容区 ── */
    contentArea: {
        flex: 1,
        overflowY: 'auto' as const,
        padding: '32px 48px 48px',
    },
    loadingArea: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
    },

    /* ── Markdown 样式 ── */
    markdownBody: {
        fontSize: 14,
        color: '#434343',
        lineHeight: 1.9,
        'h1': {
            fontSize: 26,
            fontWeight: 700,
            color: '#1a1a1a',
            marginBottom: 8,
            paddingBottom: 12,
            borderBottom: `3px solid ${token.colorPrimary}`,
        },
        'h1 + p': {
            fontSize: 15,
            color: '#595959',
            marginBottom: 28,
        },
        'h2': {
            fontSize: 20,
            fontWeight: 600,
            color: '#262626',
            marginTop: 32,
            marginBottom: 12,
            paddingBottom: 8,
            borderBottom: '2px solid #f0f0f0',
        },
        'h3': {
            fontSize: 16,
            fontWeight: 600,
            color: '#434343',
            marginTop: 24,
            marginBottom: 8,
        },
        'p': {
            margin: '8px 0',
        },
        'ul, ol': {
            paddingLeft: 20,
            margin: '8px 0',
        },
        'li': {
            margin: '4px 0',
        },
        'code': {
            background: '#f5f5f5',
            padding: '2px 6px',
            fontSize: 13,
            fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
            color: '#c7254e',
        },
        'pre': {
            background: '#1e1e1e',
            color: '#d4d4d4',
            padding: '16px 20px',
            fontSize: 13,
            lineHeight: 1.6,
            fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
            overflow: 'auto',
            margin: '12px 0',
        },
        'pre code': {
            background: 'transparent',
            padding: 0,
            color: 'inherit',
        },
        'table': {
            width: '100%',
            borderCollapse: 'collapse' as const,
            margin: '12px 0',
            fontSize: 13,
        },
        'th': {
            border: '1px solid #e8e8e8',
            padding: '8px 12px',
            background: '#fafafa',
            fontWeight: 600,
            textAlign: 'left' as const,
        },
        'td': {
            border: '1px solid #e8e8e8',
            padding: '8px 12px',
        },
        'blockquote': {
            borderLeft: `4px solid ${token.colorPrimary}`,
            padding: '8px 16px',
            margin: '12px 0',
            background: '#f0f7ff',
            color: '#434343',
        },
        'strong': {
            fontWeight: 600,
            color: '#262626',
        },
        'hr': {
            border: 'none',
            borderTop: '1px solid #f0f0f0',
            margin: '24px 0',
        },
        'img': {
            maxWidth: '100%',
            margin: '12px 0',
            borderRadius: 4,
            border: '1px solid #f0f0f0',
        },
    },

    /* ── 快速步骤概览 ── */
    stepsOverview: {
        background: '#f8fafc',
        border: '1px solid #e8ecf0',
        padding: '20px 24px',
        marginBottom: 32,
    },
    stepsTitle: {
        fontSize: 14,
        fontWeight: 600,
        color: '#262626',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
    },
    stepsList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 8,
    },
    stepItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: '#fff',
        border: '1px solid #f0f0f0',
        cursor: 'pointer',
        transition: 'all 0.15s',
        '&:hover': {
            borderColor: token.colorPrimary,
            background: '#f0f7ff',
        },
    },
    stepNumber: {
        width: 24,
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: token.colorPrimary,
        color: '#fff',
        fontSize: 12,
        fontWeight: 600,
        flexShrink: 0,
    },
    stepText: {
        flex: 1,
        fontSize: 13,
        color: '#262626',
        fontWeight: 500,
    },
    stepGo: {
        fontSize: 11,
        color: token.colorPrimary,
        flexShrink: 0,
    },

    /* ── 空状态 ── */
    emptyContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
}));

/* ══════════════════════════════════════════════════
   组件
   ══════════════════════════════════════════════════ */
const GuidePage: React.FC = () => {
    const { styles, cx } = useStyles();
    const params = useParams<{ id?: string }>();
    const [search, setSearch] = useState('');
    const [markdownContent, setMarkdownContent] = useState<string>('');
    const [loading, setLoading] = useState(false);

    // 根据路由参数或默认选中第一篇
    const [selectedId, setSelectedId] = useState<string>(
        params.id || GUIDE_ARTICLES[0]?.id || '',
    );

    // 搜索过滤
    const filteredArticles = useMemo(() => {
        if (!search.trim()) return GUIDE_ARTICLES;
        const q = search.trim().toLowerCase();
        return GUIDE_ARTICLES.filter(
            (a) =>
                a.title.toLowerCase().includes(q) ||
                a.desc.toLowerCase().includes(q),
        );
    }, [search]);

    // 按分类分组
    const groupedArticles = useMemo(() => {
        const order: GuideCategory[] = ['quick', 'module', 'flow'];
        return order
            .map((cat) => ({
                category: cat,
                label: GUIDE_CATEGORY_LABELS[cat],
                items: filteredArticles.filter((a) => a.category === cat),
            }))
            .filter((g) => g.items.length > 0);
    }, [filteredArticles]);

    const selectedArticle = GUIDE_ARTICLES.find((a) => a.id === selectedId);

    // 加载 Markdown 文件
    useEffect(() => {
        if (!selectedArticle?.markdownFile) {
            setMarkdownContent('');
            return;
        }
        setLoading(true);
        fetch(selectedArticle.markdownFile)
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load');
                return res.text();
            })
            .then((text) => setMarkdownContent(text))
            .catch(() => setMarkdownContent('> ⚠️ 文档加载失败，请检查文件路径。'))
            .finally(() => setLoading(false));
    }, [selectedArticle?.markdownFile]);

    return (
        <div className={styles.page}>
            {/* 左侧文章列表 */}
            <div className={styles.sidebar}>
                <div className={styles.sideHeader}>
                    <div className={styles.backBtnWrap}>
                        <div
                            className={styles.backBtn}
                            onClick={() => history.push('/workbench')}
                        >
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
                            onChange={(e) => setSearch(e.target.value)}
                            allowClear
                            className={styles.searchInput}
                        />
                    </div>
                </div>
                <div className={styles.articleList}>
                    {groupedArticles.length === 0 ? (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="无匹配结果"
                            style={{ padding: '40px 0' }}
                        />
                    ) : (
                        groupedArticles.map((group) => (
                            <React.Fragment key={group.category}>
                                <div className={styles.categoryLabel}>{group.label}</div>
                                {group.items.map((article) => (
                                    <div
                                        key={article.id}
                                        className={cx(
                                            styles.articleItem,
                                            selectedId === article.id && styles.articleItemActive,
                                        )}
                                        onClick={() => {
                                            setSelectedId(article.id);
                                            history.replace(`/guide/${article.id}`);
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
                        ))
                    )}
                </div>
            </div>

            {/* 右侧内容区 */}
            <div className={styles.contentArea}>
                {selectedArticle ? (
                    <>
                        {/* 快速步骤概览（仅快速指南显示） */}
                        {selectedArticle.steps.length > 0 && (
                            <div className={styles.stepsOverview}>
                                <div className={styles.stepsTitle}>
                                    <CheckCircleFilled style={{ color: '#52c41a' }} />
                                    快速步骤
                                </div>
                                <div className={styles.stepsList}>
                                    {selectedArticle.steps.map((step, i) => (
                                        <div
                                            key={i}
                                            className={styles.stepItem}
                                            onClick={() => history.push(step.path)}
                                        >
                                            <span className={styles.stepNumber}>{i + 1}</span>
                                            <span className={styles.stepText}>{step.title}</span>
                                            <span className={styles.stepGo}>
                                                前往 <RightOutlined />
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Markdown 内容 */}
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
                ) : (
                    <div className={styles.emptyContent}>
                        <Empty description="请从左侧选择一篇指南" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default GuidePage;

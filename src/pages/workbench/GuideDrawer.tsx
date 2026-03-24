/**
 * 引导式 Drawer 组件
 *
 * 从工作台「快速指南」卡片点击后弹出，展示分步引导。
 */
import React, { useState } from 'react';
import { Drawer, Button, Steps } from 'antd';
import {
    RightOutlined,
    ArrowLeftOutlined,
    ArrowRightOutlined,
    CheckCircleOutlined,
    CheckCircleFilled,
    ReadOutlined,
    BulbFilled,
    InfoCircleOutlined,
} from '@ant-design/icons';
import { history, useAccess } from '@umijs/max';
import { createStyles } from 'antd-style';
import type { GuideArticle } from '@/pages/guide/guideData';
import { canAccessPath } from '@/utils/pathAccess';

const useStyles = createStyles(({ token }) => ({
    drawerBody: {
        display: 'flex',
        flexDirection: 'column' as const,
        height: '100%',
    },
    header: {
        padding: '20px 24px 16px',
        borderBottom: '1px solid #f0f0f0',
        background: 'linear-gradient(135deg, #f0f7ff 0%, #fff 100%)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 600,
        color: '#262626',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    },
    headerIcon: {
        fontSize: 20,
        color: token.colorPrimary,
    },
    headerDesc: {
        fontSize: 13,
        color: '#8c8c8c',
        marginTop: 6,
    },
    progressInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        fontSize: 12,
        color: '#595959',
    },
    progressBar: {
        flex: 1,
        height: 4,
        background: '#f0f0f0',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        background: token.colorPrimary,
        transition: 'width 0.3s ease',
    },
    content: {
        flex: 1,
        display: 'flex',
        gap: 20,
        padding: '20px 24px',
        overflow: 'hidden',
    },
    stepsCol: {
        width: 180,
        flexShrink: 0,
    },
    detailCol: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 16,
        overflow: 'auto',
    },
    stepCard: {
        background: '#f8fafc',
        border: '1px solid #e8ecf0',
        padding: '20px 24px',
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: 600,
        color: '#262626',
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    stepNumber: {
        width: 22,
        height: 22,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: token.colorPrimary,
        color: '#fff',
        fontSize: 11,
        fontWeight: 600,
        flexShrink: 0,
    },
    stepDesc: {
        fontSize: 14,
        color: '#595959',
        lineHeight: 1.8,
    },
    tipsCard: {
        background: '#fffbe6',
        border: '1px solid #ffe58f',
        padding: '16px 20px',
    },
    tipsTitle: {
        fontSize: 13,
        fontWeight: 600,
        color: '#ad6800',
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
    },
    tipsList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
    },
    tipItem: {
        fontSize: 13,
        color: '#614700',
        lineHeight: 1.8,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6,
        '&::before': {
            content: '"•"',
            color: '#faad14',
            fontWeight: 700,
            flexShrink: 0,
            marginTop: 1,
        },
    },
    nextStepCard: {
        background: '#f6ffed',
        border: '1px solid #b7eb8f',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    },
    nextStepIcon: {
        color: '#52c41a',
        fontSize: 16,
        flexShrink: 0,
    },
    nextStepText: {
        fontSize: 13,
        color: '#389e0d',
    },
    stepAction: {
        marginTop: 4,
    },
    footer: {
        padding: '14px 24px',
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    footerRight: {
        display: 'flex',
        gap: 8,
    },
    docLink: {
        fontSize: 13,
        color: token.colorPrimary,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        '&:hover': {
            textDecoration: 'underline',
        },
    },
}));

interface GuideDrawerProps {
    open: boolean;
    article: GuideArticle | null;
    onClose: () => void;
}

const GuideDrawer: React.FC<GuideDrawerProps> = ({ open, article, onClose }) => {
    const { styles } = useStyles();
    const access = useAccess();
    const [currentStep, setCurrentStep] = useState(0);

    // 关闭时重置步骤
    const handleClose = () => {
        setCurrentStep(0);
        onClose();
    };

    if (!article) return null;

    const step = article.steps[currentStep];
    const canVisitStep = canAccessPath(step.path, access);
    const isLast = currentStep === article.steps.length - 1;
    const nextStep = !isLast ? article.steps[currentStep + 1] : null;
    const progressPct = ((currentStep + 1) / article.steps.length) * 100;

    return (
        <Drawer
            open={open}
            onClose={handleClose}
            width={620}
            closable={false}
            title={null}
            styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
        >
            <div className={styles.drawerBody}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <span className={styles.headerIcon}>{article.icon}</span>
                        {article.title}
                    </div>
                    <div className={styles.headerDesc}>{article.desc}</div>
                    <div className={styles.progressInfo}>
                        <span>步骤 {currentStep + 1} / {article.steps.length}</span>
                        <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {/* Left: Steps */}
                    <div className={styles.stepsCol}>
                        <Steps
                            direction="vertical"
                            current={currentStep}
                            onChange={(s) => setCurrentStep(s)}
                            size="small"
                            items={article.steps.map((s, i) => ({
                                title: s.title,
                                status: i < currentStep ? 'finish' : i === currentStep ? 'process' : 'wait',
                            }))}
                        />
                    </div>

                    {/* Right: Step detail */}
                    <div className={styles.detailCol}>
                        {/* 当前步骤卡片 */}
                        <div className={styles.stepCard}>
                            <div className={styles.stepTitle}>
                                <span className={styles.stepNumber}>{currentStep + 1}</span>
                                {step.title}
                            </div>
                            <div className={styles.stepDesc}>{step.desc}</div>
                            <div className={styles.stepAction}>
                                <Button
                                    type="primary"
                                    icon={<RightOutlined />}
                                    disabled={!canVisitStep}
                                    onClick={() => {
                                        if (!canVisitStep) return;
                                        history.push(step.path);
                                        handleClose();
                                    }}
                                >
                                    前往配置
                                </Button>
                            </div>
                        </div>

                        {/* 小贴士卡片 */}
                        {step.tips && step.tips.length > 0 && (
                            <div className={styles.tipsCard}>
                                <div className={styles.tipsTitle}>
                                    <BulbFilled style={{ color: '#faad14' }} /> 小贴士
                                </div>
                                <ul className={styles.tipsList}>
                                    {step.tips.map((tip, i) => (
                                        <li key={i} className={styles.tipItem}>{tip}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* 下一步预览 */}
                        {nextStep && (
                            <div className={styles.nextStepCard}>
                                <InfoCircleOutlined className={styles.nextStepIcon} />
                                <span className={styles.nextStepText}>
                                    下一步：<strong>{nextStep.title}</strong> — {nextStep.desc}
                                </span>
                            </div>
                        )}

                        {/* 最后一步完成提示 */}
                        {isLast && (
                            <div className={styles.nextStepCard} style={{ background: '#f0f7ff', borderColor: '#91caff' }}>
                                <CheckCircleFilled style={{ color: '#1677ff', fontSize: 16 }} />
                                <span className={styles.nextStepText} style={{ color: '#0958d9' }}>
                                    完成所有步骤后即可开始使用！点击下方「查看完整文档」了解更多细节。
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <div className={styles.footerLeft}>
                        <span
                            className={styles.docLink}
                            onClick={() => {
                                history.push(`/guide/${article.id}`);
                                handleClose();
                            }}
                        >
                            <ReadOutlined /> 查看完整文档
                        </span>
                    </div>
                    <div className={styles.footerRight}>
                        <Button
                            disabled={currentStep === 0}
                            icon={<ArrowLeftOutlined />}
                            onClick={() => setCurrentStep((s) => s - 1)}
                        >
                            上一步
                        </Button>
                        {isLast ? (
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                onClick={handleClose}
                            >
                                完成
                            </Button>
                        ) : (
                            <Button
                                type="primary"
                                onClick={() => setCurrentStep((s) => s + 1)}
                            >
                                下一步 <ArrowRightOutlined />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Drawer>
    );
};

export default GuideDrawer;

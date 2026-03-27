import React, { useEffect, useState } from 'react';
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
import type { GuideArticle } from '@/pages/guide/guideData';
import { canAccessPath } from '@/utils/pathAccess';
import { useGuideDrawerStyles } from './guideDrawerStyles';

interface GuideDrawerProps {
    open: boolean;
    article: GuideArticle | null;
    onClose: () => void;
}

const GuideDrawer: React.FC<GuideDrawerProps> = ({ open, article, onClose }) => {
    const { styles } = useGuideDrawerStyles();
    const access = useAccess();
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        setCurrentStep(0);
    }, [article?.id, open]);

    const handleClose = () => {
        setCurrentStep(0);
        onClose();
    };

    if (!article) return null;
    if (article.steps.length === 0) return null;

    const activeStepIndex = Math.min(currentStep, article.steps.length - 1);
    const step = article.steps[activeStepIndex];
    const canVisitStep = canAccessPath(step.path, access);
    const isLast = activeStepIndex === article.steps.length - 1;
    const nextStep = !isLast ? article.steps[activeStepIndex + 1] : null;
    const progressPct = ((activeStepIndex + 1) / article.steps.length) * 100;

    return (
        <Drawer
            open={open}
            onClose={handleClose}
            styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
            size={620}
            closable={false}
            title={null}
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
                        <span>步骤 {activeStepIndex + 1} / {article.steps.length}</span>
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
                            orientation="vertical"
                            current={activeStepIndex}
                            onChange={(s) => setCurrentStep(s)}
                            size="small"
                            items={article.steps.map((s, i) => ({
                                title: s.title,
                                status: i < activeStepIndex ? 'finish' : i === activeStepIndex ? 'process' : 'wait',
                            }))}
                        />
                    </div>

                    {/* Right: Step detail */}
                    <div className={styles.detailCol}>
                        {/* 当前步骤卡片 */}
                        <div className={styles.stepCard}>
                            <div className={styles.stepTitle}>
                                <span className={styles.stepNumber}>{activeStepIndex + 1}</span>
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
                            disabled={activeStepIndex === 0}
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
                                onClick={() => setCurrentStep((s) => Math.min(s + 1, article.steps.length - 1))}
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

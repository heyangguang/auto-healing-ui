import React from 'react';
import { Button, Tabs } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';
import './index.css';

export interface SubPageHeaderProps {
    /** Tab 列表 */
    tabs?: TabsProps['items'];
    /** 当前激活的 tab key */
    activeTab?: string;
    /** tab 切换回调 */
    onTabChange?: (key: string) => void;
    /** 页面标题 */
    title: React.ReactNode;
    /** 标题右侧的额外内容（如状态 Tag） */
    titleExtra?: React.ReactNode;
    /** 返回按钮点击回调 */
    onBack: () => void;
    /** 右侧操作按钮区域 */
    actions?: React.ReactNode;
}

/**
 * 子页面通用头部组件
 * 渲染一个卡片：Tab（可选） + 标题栏
 * 内容区域由页面自行渲染为独立卡片
 */
const SubPageHeader: React.FC<SubPageHeaderProps> = ({
    tabs,
    activeTab,
    onTabChange,
    title,
    titleExtra,
    onBack,
    actions,
}) => {
    return (
        <div className="sub-page-header-card">
            {/* Tab 区域 */}
            {tabs && tabs.length > 0 && (
                <div className="sub-page-header-tabs">
                    <Tabs
                        items={tabs}
                        activeKey={activeTab}
                        onChange={onTabChange}
                    />
                </div>
            )}

            {/* 标题栏 */}
            <div className="sub-page-header-bar">
                <div className="sub-page-header-left">
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        className="sub-page-header-back-btn"
                        onClick={onBack}
                    />
                    <h3 className="sub-page-header-title">{title}</h3>
                    {titleExtra}
                </div>
                {actions && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubPageHeader;

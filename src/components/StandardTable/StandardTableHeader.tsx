import React from 'react';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';

type StandardTableHeaderProps = {
    activeTab?: string;
    description: string;
    headerExtra?: React.ReactNode;
    headerIcon?: React.ReactNode;
    onTabChange?: (key: string) => void;
    tabs?: TabsProps['items'];
    title: string;
};

function StandardTableHeader({
    activeTab,
    description,
    headerExtra,
    headerIcon,
    onTabChange,
    tabs,
    title,
}: StandardTableHeaderProps) {
    return (
        <div className="standard-table-header">
            {tabs && tabs.length > 0 && (
                <Tabs
                    activeKey={activeTab}
                    onChange={onTabChange}
                    items={tabs}
                    className="standard-table-tabs"
                />
            )}
            <div className="standard-table-header-content">
                <div className="standard-table-header-left">
                    <h2 className="standard-table-title">{title}</h2>
                    <p className="standard-table-description">{description}</p>
                </div>
                {headerIcon && (
                    <div className="standard-table-header-icon">
                        {headerIcon}
                    </div>
                )}
            </div>
            {headerExtra}
        </div>
    );
}

export default StandardTableHeader;

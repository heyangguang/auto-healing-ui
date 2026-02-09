import { PageContainer } from '@ant-design/pro-components';
import { Card, Result, Button } from 'antd';
import { history } from '@umijs/max';
import React from 'react';

const CMDBDetail: React.FC = () => {
    return (
        <PageContainer>
            <Card>
                <Result
                    status="info"
                    title="配置项详情"
                    subTitle="此功能正在开发中，敬请期待"
                    extra={[
                        <Button type="primary" key="back" onClick={() => history.push('/cmdb')}>
                            返回列表
                        </Button>,
                    ]}
                />
            </Card>
        </PageContainer>
    );
};

export default CMDBDetail;

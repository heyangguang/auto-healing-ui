import { PageContainer } from '@ant-design/pro-components';
import { Card, Result, Button } from 'antd';
import { history } from '@umijs/max';
import React from 'react';

const ApprovalList: React.FC = () => {
    return (
        <PageContainer>
            <Card>
                <Result
                    status="info"
                    title="审批任务"
                    subTitle="此功能正在开发中，敬请期待"
                    extra={[
                        <Button type="primary" key="back" onClick={() => history.push('/dashboard')}>
                            返回首页
                        </Button>,
                    ]}
                />
            </Card>
        </PageContainer>
    );
};

export default ApprovalList;

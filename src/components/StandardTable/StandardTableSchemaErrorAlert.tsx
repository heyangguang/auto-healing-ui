import React from 'react';
import { Alert } from 'antd';

type StandardTableSchemaErrorAlertProps = {
    error: string;
};

function StandardTableSchemaErrorAlert({
    error,
}: StandardTableSchemaErrorAlertProps) {
    return (
        <Alert
            showIcon
            type="error"
            title="高级搜索条件加载失败"
            description={error}
            style={{ marginBottom: 16 }}
        />
    );
}

export default StandardTableSchemaErrorAlert;

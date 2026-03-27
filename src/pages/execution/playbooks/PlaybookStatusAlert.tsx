import React from 'react';
import { Alert } from 'antd';

type PlaybookStatusAlertProps = {
    playbook: AutoHealing.Playbook;
};

export default function PlaybookStatusAlert(props: PlaybookStatusAlertProps) {
    const { playbook } = props;

    if (playbook.status === 'pending' && !playbook.last_scanned_at) {
        return <Alert type="warning" showIcon message="此 Playbook 尚未扫描变量，请点击「扫描变量」按钮" style={{ marginTop: 16 }} />;
    }

    if (playbook.status === 'scanned') {
        return <Alert type="info" showIcon message="变量已扫描，请点击「上线」按钮使 Playbook 可用于执行任务" style={{ marginTop: 16 }} />;
    }

    if (playbook.status === 'error') {
        return <Alert type="error" showIcon message="扫描出错，请检查入口文件和仓库同步状态" style={{ marginTop: 16 }} />;
    }

    if (playbook.status === 'invalid') {
        return <Alert type="error" showIcon message="入口文件不存在，请检查仓库同步状态" style={{ marginTop: 16 }} />;
    }

    return null;
}

import React from 'react';
import { Button } from 'antd';
import { FileTextOutlined, RightOutlined } from '@ant-design/icons';

type GitRepoPlaybooksCardProps = {
    drawerPlaybooks: AutoHealing.Playbook[];
    onOpenPlaybooks: () => void;
};

export default function GitRepoPlaybooksCard(props: GitRepoPlaybooksCardProps) {
    const { drawerPlaybooks, onOpenPlaybooks } = props;
    if (drawerPlaybooks.length === 0) {
        return null;
    }

    return (
        <div className="git-detail-card">
            <div className="git-detail-card-header">
                <FileTextOutlined className="git-detail-card-header-icon" />
                <span className="git-detail-card-header-title">关联 Playbook</span>
                <span className="git-detail-card-header-count">{drawerPlaybooks.length} 个</span>
                <Button type="link" size="small" onClick={onOpenPlaybooks} style={{ marginLeft: 'auto', paddingInline: 0 }}>
                    查看列表
                </Button>
            </div>
            <div style={{ padding: 0 }}>
                {drawerPlaybooks.map((playbook) => (
                    <div key={playbook.id} className="git-playbook-link">
                        <div className="git-playbook-link-icon"><FileTextOutlined /></div>
                        <div className="git-playbook-link-info">
                            <div className="git-playbook-link-name">{playbook.name}</div>
                            {playbook.file_path && <div className="git-playbook-link-path">{playbook.file_path}</div>}
                        </div>
                        <RightOutlined style={{ color: '#d9d9d9', fontSize: 12 }} />
                    </div>
                ))}
            </div>
        </div>
    );
}

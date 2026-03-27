import React from 'react';
import { Alert, Col, Form, Input, Row } from 'antd';

export default function SecretFormFileSection() {
    return (
        <>
            <Alert type="info" message="直接读取部署服务器上的 SSH 私钥文件，适用于密钥存储在本地的场景。" style={{ marginBottom: 16 }} />
            <Row gutter={24}>
                <Col span={12}>
                    <Form.Item
                        name="file_key_path"
                        label="私钥文件路径"
                        tooltip="服务器上私钥文件的绝对路径。系统将读取此文件用于 SSH 认证"
                        rules={[{ required: true, message: '请输入私钥绝对路径' }]}
                        extra="例如：/root/.ssh/id_rsa 或 /home/deploy/.ssh/id_ed25519"
                    >
                        <Input placeholder="/root/.ssh/id_rsa" />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item
                        name="file_username"
                        label="默认用户名"
                        tooltip="SSH 连接时使用的默认用户名。如果任务模板中未指定用户名，将使用此值"
                        extra="通常为 root 或专用的运维账号"
                        style={{ marginBottom: 0 }}
                    >
                        <Input placeholder="root" />
                    </Form.Item>
                </Col>
            </Row>
        </>
    );
}

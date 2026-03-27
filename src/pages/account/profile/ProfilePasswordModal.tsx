import React from 'react';
import { Form, Input, Modal } from 'antd';

type ProfilePasswordModalProps = {
    form: ReturnType<typeof Form.useForm>[0];
    onCancel: () => void;
    onSubmit: () => void;
    open: boolean;
};

const ProfilePasswordModal: React.FC<ProfilePasswordModalProps> = ({ form, onCancel, onSubmit, open }) => (
    <Modal title="修改密码" open={open} onCancel={onCancel} onOk={onSubmit} destroyOnHidden>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item name="old_password" label="当前密码" rules={[{ required: true, message: '请输入当前密码' }]}>
                <Input.Password placeholder="请输入当前密码" />
            </Form.Item>
            <Form.Item name="new_password" label="新密码" rules={[{ required: true, min: 8, message: '密码至少8位' }]}>
                <Input.Password placeholder="请输入新密码（至少8位）" />
            </Form.Item>
            <Form.Item
                name="confirm_password"
                label="确认密码"
                dependencies={['new_password']}
                rules={[
                    { required: true, message: '请确认新密码' },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            return !value || getFieldValue('new_password') === value
                                ? Promise.resolve()
                                : Promise.reject(new Error('两次密码不一致'));
                        },
                    }),
                ]}
            >
                <Input.Password placeholder="请再次输入新密码" />
            </Form.Item>
        </Form>
    </Modal>
);

export default ProfilePasswordModal;

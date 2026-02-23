import { history, Link } from '@umijs/max';
import { Alert, Button, ConfigProvider, Form, Input, message, Spin } from 'antd';
import { createStyles } from 'antd-style';
import React, { useEffect, useState } from 'react';
import { Helmet } from '@umijs/max';
import { UserOutlined, LockOutlined, IdcardOutlined } from '@ant-design/icons';
import { request } from '@umijs/max';
import Settings from '../../../../config/defaultSettings';

const useStyles = createStyles(({ token }) => ({
  container: {
    display: 'flex',
    height: '100vh',
    width: '100%',
    overflow: 'hidden',
    margin: 0,
    padding: 0,
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  leftPanel: {
    flex: '0 0 60%',
    backgroundColor: '#161616',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '0 80px',
    position: 'relative',
    overflow: 'hidden',
    backgroundImage:
      'radial-gradient(circle at 10% 20%, rgba(15, 98, 254, 0.1) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(15, 98, 254, 0.05) 0%, transparent 20%)',
  },
  rightPanel: {
    flex: '1',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
  },
  brandTitle: {
    fontSize: '48px',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '24px',
    fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
    lineHeight: 1.1,
  },
  brandSubtitle: {
    fontSize: '18px',
    color: '#c6c6c6',
    maxWidth: '500px',
    lineHeight: 1.5,
    fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
  },
  formContainer: {
    width: '100%',
    maxWidth: '400px',
  },
  formTitle: {
    fontSize: '28px',
    fontWeight: 400,
    color: '#161616',
    marginBottom: '4px',
    fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
  },
  formSubtitle: {
    fontSize: '14px',
    color: '#525252',
    marginBottom: '24px',
    fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
  },
  logoWatermark: {
    position: 'absolute' as const,
    bottom: '-10%',
    right: '-10%',
    width: '60%',
    opacity: 0.03,
    pointerEvents: 'none' as const,
  },
  footerContainer: {
    position: 'absolute' as const,
    bottom: 20,
    width: '100%',
    textAlign: 'center' as const,
    fontSize: '12px',
    color: '#8d8d8d',
  },
  fieldLabel: {
    fontSize: '12px',
    color: '#525252',
    display: 'block',
    marginBottom: '4px',
    fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
  },
}));

const RegisterPage: React.FC = () => {
  const { styles } = useStyles();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [invitationEmail, setInvitationEmail] = useState('');
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenError, setTokenError] = useState('');

  // 从 URL 获取 token
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token') || '';

  // 验证邀请 token
  useEffect(() => {
    if (!token) {
      setTokenError('缺少邀请令牌，请通过邀请链接访问此页面');
      setValidatingToken(false);
      return;
    }
    // 尝试校验 token（先显示页面，让用户填写信息）
    setValidatingToken(false);
    setInvitationEmail('');
  }, [token]);

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      await request('/api/v1/auth/register', {
        method: 'POST',
        data: {
          token,
          username: values.username,
          password: values.password,
          display_name: values.display_name || '',
        },
      });
      message.success('注册成功！请使用新账号登录');
      history.push('/user/login');
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        '注册失败，请重试';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 0,
          colorPrimary: '#0f62fe',
          fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
        },
        components: {
          Input: {
            borderRadius: 0,
            colorBgContainer: '#f4f4f4',
            colorBorder: 'transparent',
            activeBorderColor: '#0f62fe',
            hoverBorderColor: '#0f62fe',
            controlHeightLG: 48,
            paddingInlineLG: 16,
          },
          Button: {
            borderRadius: 0,
            controlHeightLG: 48,
            primaryColor: '#ffffff',
            defaultBg: '#0f62fe',
            defaultColor: '#ffffff',
          },
        },
      }}
    >
      <div className={styles.container}>
        <Helmet>
          <title>注册{Settings.title && ` - ${Settings.title}`}</title>
        </Helmet>

        {/* Left Panel - Branding */}
        <div className={styles.leftPanel}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
            <img src="/logo.svg" alt="logo" style={{ height: 48, marginRight: 16 }} />
          </div>
          <h1 className={styles.brandTitle}>
            KY-AHS
            <br />
            Enterprise
          </h1>
          <p className={styles.brandSubtitle}>
            智能化运维与故障自愈平台。
            <br />
            Intelligent Operations & Auto-Healing Platform.
          </p>
          <img src="/logo.svg" alt="" className={styles.logoWatermark} />
        </div>

        {/* Right Panel - Register Form */}
        <div className={styles.rightPanel}>
          <div className={styles.formContainer}>
            <div className={styles.formTitle}>Create account</div>
            <div className={styles.formSubtitle}>通过邀请链接创建您的账户</div>

            {tokenError ? (
              <div>
                <Alert
                  type="error"
                  message={tokenError}
                  showIcon
                  style={{ marginBottom: 24, borderRadius: 0 }}
                />
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={() => history.push('/user/login')}
                >
                  返回登录
                </Button>
              </div>
            ) : validatingToken ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16, color: '#525252' }}>验证邀请令牌...</div>
              </div>
            ) : (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                requiredMark={false}
                size="large"
              >
                {errorMsg && (
                  <Alert
                    message={errorMsg}
                    type="error"
                    showIcon
                    style={{ marginBottom: 24, borderRadius: 0 }}
                  />
                )}

                <div style={{ marginBottom: 12 }}>
                  <span className={styles.fieldLabel}>用户名 *</span>
                  <Form.Item
                    name="username"
                    noStyle
                    rules={[
                      { required: true, message: '请输入用户名' },
                      { min: 3, message: '用户名至少 3 个字符' },
                      { max: 50, message: '用户名最多 50 个字符' },
                      {
                        pattern: /^[a-zA-Z0-9_.-]+$/,
                        message: '只允许字母、数字、下划线、点和连字符',
                      },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined style={{ color: '#a8a8a8' }} />}
                      placeholder="请设置您的登录用户名"
                    />
                  </Form.Item>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <span className={styles.fieldLabel}>显示名称</span>
                  <Form.Item name="display_name" noStyle>
                    <Input
                      prefix={<IdcardOutlined style={{ color: '#a8a8a8' }} />}
                      placeholder="可选，如：张三"
                    />
                  </Form.Item>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <span className={styles.fieldLabel}>密码 *</span>
                  <Form.Item
                    name="password"
                    noStyle
                    rules={[
                      { required: true, message: '请输入密码' },
                      { min: 8, message: '密码至少 8 个字符' },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: '#a8a8a8' }} />}
                      placeholder="至少 8 位密码"
                    />
                  </Form.Item>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <span className={styles.fieldLabel}>确认密码 *</span>
                  <Form.Item
                    name="confirm"
                    noStyle
                    dependencies={['password']}
                    rules={[
                      { required: true, message: '请确认密码' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('两次输入的密码不一致'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: '#a8a8a8' }} />}
                      placeholder="再次输入密码"
                    />
                  </Form.Item>
                </div>

                <Form.Item style={{ marginBottom: 16 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={submitting}
                    block
                  >
                    注 册
                  </Button>
                </Form.Item>

                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 13, color: '#525252' }}>已有账号？</span>{' '}
                  <Link
                    to="/user/login"
                    style={{ fontSize: 13, color: '#0f62fe', fontWeight: 500 }}
                  >
                    返回登录
                  </Link>
                </div>
              </Form>
            )}
          </div>
          <div className={styles.footerContainer}>
            Copyright © 2026 KY-AHS Experience Technology Department
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default RegisterPage;

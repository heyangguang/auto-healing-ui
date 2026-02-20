import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormCheckbox, ProFormText } from '@ant-design/pro-components';
import { Helmet, history, SelectLang, useIntl, useModel } from '@umijs/max';
import { Alert, App, ConfigProvider } from 'antd';
import { createStyles } from 'antd-style';
import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { login } from '@/services/auto-healing/auth';
import { TokenManager } from '@/requestErrorConfig';
import Settings from '../../../../config/defaultSettings';

const useStyles = createStyles(({ token }) => {
  return {
    lang: {
      width: 42,
      height: 42,
      lineHeight: '42px',
      position: 'fixed',
      right: 16,
      top: 16,
      borderRadius: 0,
      ':hover': {
        backgroundColor: token.colorBgTextHover,
      },
      zIndex: 999,
    },
    container: {
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
    },
    leftPanel: {
      flex: '0 0 60%',
      backgroundColor: '#161616', // IBM Gray 100
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '0 80px',
      position: 'relative',
      overflow: 'hidden',
      backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(15, 98, 254, 0.1) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(15, 98, 254, 0.05) 0%, transparent 20%)',
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
      color: '#c6c6c6', // IBM Gray 30
      maxWidth: '500px',
      lineHeight: 1.5,
      fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
    },
    loginFormContainer: {
      width: '100%',
      maxWidth: '400px',
    },
    formTitle: {
      fontSize: '32px',
      fontWeight: 400,
      color: '#161616',
      marginBottom: '40px',
      fontFamily: "'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif",
    },
    logoWatermark: {
      position: 'absolute',
      bottom: '-10%',
      right: '-10%',
      width: '60%',
      opacity: 0.03,
      pointerEvents: 'none',
    },
    footerContainer: {
      position: 'absolute',
      bottom: 20,
      width: '100%',
      textAlign: 'center',
      fontSize: '12px',
      color: '#8d8d8d',
    }
  };
});

const Lang = () => {
  const { styles } = useStyles();
  return (
    <div className={styles.lang} data-lang>
      {SelectLang && <SelectLang />}
    </div>
  );
};

const LoginMessage: React.FC<{ content: string }> = ({ content }) => {
  return (
    <Alert
      style={{ marginBottom: 24, borderRadius: 0 }}
      message={content}
      type="error"
      showIcon
    />
  );
};

const Login: React.FC = () => {
  const [loginError, setLoginError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const { initialState, setInitialState } = useModel('@@initialState');
  const { styles } = useStyles();
  const { message } = App.useApp();
  const intl = useIntl();

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      flushSync(() => {
        setInitialState((s) => ({
          ...s,
          currentUser: userInfo,
        }));
      });
    }
  };

  const handleSubmit = async (values: { username: string; password: string }) => {
    setSubmitting(true);
    setLoginError('');

    try {
      const response = await login({
        username: values.username,
        password: values.password,
      });

      // 保存 Token
      TokenManager.setTokens(response.access_token, response.refresh_token);

      // 🆕 保存租户信息
      if (response.tenants && response.tenants.length > 0) {
        const tenantStorage = {
          currentTenantId: response.current_tenant_id,
          tenants: response.tenants,
        };
        localStorage.setItem('tenant-storage', JSON.stringify(tenantStorage));
        console.log('[Login] 租户信息已保存:', tenantStorage);

        message.success(
          intl.formatMessage({
            id: 'pages.login.success',
            defaultMessage: '登录成功！',
          })
        );

        await fetchUserInfo();

        const urlParams = new URL(window.location.href).searchParams;
        const redirect = urlParams.get('redirect') || '/';
        history.push(redirect);
      } else {
        // 🆕 无租户: 跳转提示页
        message.warning('您暂无租户权限,请联系管理员分配');
        history.push('/no-tenant');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message
        || error?.message
        || intl.formatMessage({
          id: 'pages.login.failure',
          defaultMessage: '登录失败,请重试！',
        });
      setLoginError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 0,
          colorPrimary: '#0f62fe', // IBM Blue
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
          }
        }
      }}
    >
      <div className={styles.container}>
        <Helmet>
          <title>
            {intl.formatMessage({ id: 'menu.login', defaultMessage: '登录' })}
            {Settings.title && ` - ${Settings.title}`}
          </title>
        </Helmet>

        {/* Left Panel - Branding */}
        <div className={styles.leftPanel}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
            <img src="/logo.svg" alt="logo" style={{ height: 48, marginRight: 16 }} />
          </div>
          <h1 className={styles.brandTitle}>
            KY-AHS<br />
            Enterprise
          </h1>
          <p className={styles.brandSubtitle}>
            智能化运维与故障自愈平台。<br />
            Intelligent Operations & Auto-Healing Platform.
          </p>
          {/* Decorative Watermark */}
          <img src="/logo.svg" alt="" className={styles.logoWatermark} />
        </div>

        {/* Right Panel - Login Form */}
        <div className={styles.rightPanel}>
          <Lang />
          <div className={styles.loginFormContainer}>
            <div className={styles.formTitle}>Log in</div>

            <LoginForm
              contentStyle={{
                minWidth: '100%',
                padding: 0,
              }}
              logo={null}
              title={null}
              subTitle={null}
              initialValues={{
                autoLogin: true,
                username: 'admin',
              }}
              submitter={{
                searchConfig: {
                  submitText: intl.formatMessage({ id: 'pages.login.submit', defaultMessage: '登录' }),
                },
                submitButtonProps: {
                  loading: submitting,
                  size: 'large',
                  style: { width: '100%' },
                },
              }}
              onFinish={handleSubmit}
            >
              {loginError && <LoginMessage content={loginError} />}

              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#525252', display: 'block', marginBottom: 8 }}>
                  {intl.formatMessage({ id: 'pages.login.username.placeholder', defaultMessage: '用户名' })}
                </span>
                <ProFormText
                  name="username"
                  fieldProps={{
                    size: 'large',
                    prefix: null,
                    className: 'enterprise-input'
                  }}
                  placeholder=""
                  rules={[
                    {
                      required: true,
                      message: intl.formatMessage({ id: 'pages.login.username.required', defaultMessage: '请输入用户名！' }),
                    },
                  ]}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 12, color: '#525252', display: 'block', marginBottom: 8 }}>
                  {intl.formatMessage({ id: 'pages.login.password.placeholder', defaultMessage: '密码' })}
                </span>
                <ProFormText.Password
                  name="password"
                  fieldProps={{
                    size: 'large',
                    prefix: null,
                  }}
                  placeholder=""
                  rules={[
                    {
                      required: true,
                      message: intl.formatMessage({ id: 'pages.login.password.required', defaultMessage: '请输入密码！' }),
                    },
                  ]}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <ProFormCheckbox noStyle name="autoLogin">
                  {intl.formatMessage({ id: 'pages.login.rememberMe', defaultMessage: '记住登录状态' })}
                </ProFormCheckbox>
              </div>
            </LoginForm>
          </div>
          <div className={styles.footerContainer}>
            Copyright © 2026 KY-AHS Experience Technology Department
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default Login;

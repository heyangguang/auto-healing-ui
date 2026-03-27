import {
  UserOutlined, LockOutlined, IdcardOutlined,
  SafetyCertificateOutlined, SafetyOutlined,
  CheckCircleFilled, CloudServerOutlined,
  ThunderboltOutlined, ApartmentOutlined,
  ToolOutlined, SettingOutlined,
  DatabaseOutlined, ApiOutlined,
  TeamOutlined, BellOutlined,
} from '@ant-design/icons';
import { Helmet, history, Link } from '@umijs/max';
import { Alert, Button, ConfigProvider, Form, Input, message, Spin } from 'antd';
import React, { useEffect, useState, useRef } from 'react';
import Settings from '../../../../config/defaultSettings';
import { registerByInvitation, type InvitationValidation, validateInvitationToken } from '@/services/auto-healing/auth';
import { buildRegisterResultPath } from './registerHelpers';
import {
  getErrorMessage,
  type RegisterFormValues,
} from './registerTypes';
import { NetworkCanvas, BrandLogo, DockerLogo, K8sLogo, RedHatLogo, AnsibleLogo, PrometheusLogo, GrafanaLogo, TerraformLogo, JenkinsLogo, ElasticLogo, VaultLogo } from './registerDecorations';
import { useStyles } from './registerStyles';

const RegisterPage: React.FC = () => {
  const { styles } = useStyles();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [invitationInfo, setInvitationInfo] = useState<InvitationValidation | null>(null);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenError, setTokenError] = useState('');
  const validationRequestIdRef = useRef(0);
  const redirectTimerRef = useRef<number | null>(null);
  const token = new URLSearchParams(window.location.search).get('token') || '';
  useEffect(() => {
    const requestId = validationRequestIdRef.current + 1;
    validationRequestIdRef.current = requestId;

    if (!token) {
      setTokenError('缺少邀请令牌，平台暂不开放自助注册。');
      setInvitationInfo(null);
      setValidatingToken(false);
      return;
    }

    setValidatingToken(true);
    validateInvitationToken(token)
      .then((invitation) => {
        if (requestId !== validationRequestIdRef.current) {
          return;
        }
        setInvitationInfo(invitation);
        setTokenError('');
      })
      .catch((error: unknown) => {
        if (requestId !== validationRequestIdRef.current) {
          return;
        }
        const messageText = getErrorMessage(error, '邀请不存在或已过期');
        setInvitationInfo(null);
        setTokenError(messageText);
      })
      .finally(() => {
        if (requestId !== validationRequestIdRef.current) {
          return;
        }
        setValidatingToken(false);
      });

    return () => {
      validationRequestIdRef.current += 1;
    };
  }, [token]);

  useEffect(() => () => {
    if (redirectTimerRef.current !== null) {
      window.clearTimeout(redirectTimerRef.current);
    }
  }, []);

  const handleSubmit = async (values: RegisterFormValues) => {
    setSubmitting(true); setErrorMsg('');
    try {
      await registerByInvitation({ token, username: values.username, password: values.password, display_name: values.display_name || '' });
      message.success('注册成功！');
      redirectTimerRef.current = window.setTimeout(() => {
        history.push(buildRegisterResultPath(values.username));
      }, 1500);
    } catch (e: unknown) { setErrorMsg(getErrorMessage(e, '注册失败')); }
    finally { setSubmitting(false); }
  };

  return (
    <ConfigProvider theme={{
      token: { borderRadius: 0, colorPrimary: '#2563eb', fontFamily: "-apple-system,'PingFang SC','Microsoft YaHei',sans-serif" },
      components: { Input: { controlHeight: 40, colorBgContainer: '#fff', colorBorder: '#e5e7eb', activeBorderColor: '#2563eb', hoverBorderColor: '#93c5fd' }, Button: { controlHeight: 40 } },
    }}>
      <div className={styles.container}>
        <Helmet><title>账号注册 - {Settings.title || 'Pangolin'}</title></Helmet>
        <div className={styles.leftPanel}>
          <NetworkCanvas />
          <div className={styles.topSection}>
            <img src="/pangolin-logo-full.png" alt="Pangolin" style={{ height: 36 }} />
            <div className={styles.subBrand}>智能运维自愈引擎</div>
            <h1 className={styles.heroTitle}>让基础设施<br />拥有<span className={styles.heroHL}>自我修复</span>的能力</h1>
            <p className={styles.heroDesc}>
              基于 Ansible Playbook 的自动化故障修复平台，覆盖从<span className={styles.heroBold}>故障感知、智能诊断到自动修复</span>的完整闭环。平台已稳定运行于生产环境，管理超过 <span className={styles.heroHighlight}>10,000+</span> 台主机节点，累计编排 <span className={styles.heroHighlight}>50+</span> 套自愈剧本。
            </p>
            <p className={styles.heroDesc} style={{ marginTop: 4 }}>
              依托<span className={styles.heroBold}>规则引擎 + Playbook 编排</span>双核驱动，实现 7×24 无感自愈，将平均故障修复时间（MTTR）从小时级缩短至 <span className={styles.heroHighlight}>&lt;3 分钟</span>，自愈成功率高达 <span className={styles.heroHighlight}>99.98%</span>，真正释放运维人力，让团队聚焦于架构演进与业务创新。
            </p>
          </div>
          <div className={styles.spacer} />
          <div className={styles.bottomStack}>
            <div className={styles.engineLabel}>自愈引擎核心模块</div>
            <div className={styles.engineGrid}>
              <div className={styles.engineItem} style={{ borderLeftColor: '#38bdf8' }}><ThunderboltOutlined className={styles.ecIcon} style={{ color: '#38bdf8' }} /><div className={styles.ecText}><div className={styles.ecName}>自愈恢复引擎</div><div className={styles.ecDesc}>基于规则触发 Playbook 自动修复</div></div></div>
              <div className={styles.engineItem} style={{ borderLeftColor: '#34d399' }}><ToolOutlined className={styles.ecIcon} style={{ color: '#34d399' }} /><div className={styles.ecText}><div className={styles.ecName}>Playbook 编排</div><div className={styles.ecDesc}>可视化剧本管理与变量追踪</div></div></div>
              <div className={styles.engineItem} style={{ borderLeftColor: '#a78bfa' }}><DatabaseOutlined className={styles.ecIcon} style={{ color: '#a78bfa' }} /><div className={styles.ecText}><div className={styles.ecName}>CMDB 资产管理</div><div className={styles.ecDesc}>统一资产台账，三态生命周期</div></div></div>
              <div className={styles.engineItem} style={{ borderLeftColor: '#fbbf24' }}><SettingOutlined className={styles.ecIcon} style={{ color: '#fbbf24' }} /><div className={styles.ecText}><div className={styles.ecName}>执行任务调度</div><div className={styles.ecDesc}>定时/手动任务模板批量执行</div></div></div>
              <div className={styles.engineItem} style={{ borderLeftColor: '#f87171' }}><BellOutlined className={styles.ecIcon} style={{ color: '#f87171' }} /><div className={styles.ecText}><div className={styles.ecName}>告警通知中心</div><div className={styles.ecDesc}>邮件/钉钉/Webhook 多通道</div></div></div>
              <div className={styles.engineItem} style={{ borderLeftColor: '#60a5fa' }}><TeamOutlined className={styles.ecIcon} style={{ color: '#60a5fa' }} /><div className={styles.ecText}><div className={styles.ecName}>多租户管控</div><div className={styles.ecDesc}>RBAC 权限，租户级资源隔离</div></div></div>
            </div>
            <div className={styles.metricsRow}>
              <div className={styles.metricBox}><div className={styles.metricNum}>99.98%</div><div className={styles.metricLb}>自愈成功率</div></div>
              <div className={styles.metricBox}><div className={styles.metricNum}>18,240</div><div className={styles.metricLb}>累计自愈任务</div></div>
              <div className={styles.metricBox}><div className={styles.metricNum}>&lt;3min</div><div className={styles.metricLb}>平均修复时间</div></div>
              <div className={styles.metricBox}><div className={styles.metricNum}>92.5%</div><div className={styles.metricLb}>自动化覆盖率</div></div>
            </div>
          </div>
          <div className={styles.partnerStrip}>
            <div className={styles.partnerLabel}>技术生态合作伙伴</div>
            <div className={styles.partnerGrid}>
              <BrandLogo name="Docker"><DockerLogo /></BrandLogo><BrandLogo name="Kubernetes"><K8sLogo /></BrandLogo>
              <BrandLogo name="Red Hat"><RedHatLogo /></BrandLogo><BrandLogo name="Ansible"><AnsibleLogo /></BrandLogo>
              <BrandLogo name="Prometheus"><PrometheusLogo /></BrandLogo><BrandLogo name="Grafana"><GrafanaLogo /></BrandLogo>
              <BrandLogo name="Terraform"><TerraformLogo /></BrandLogo><BrandLogo name="Jenkins"><JenkinsLogo /></BrandLogo>
              <BrandLogo name="Elastic"><ElasticLogo /></BrandLogo><BrandLogo name="Vault"><VaultLogo /></BrandLogo>
            </div>
          </div>
        </div>
        <div className={styles.rightPanel}>
          <div className={styles.dotBg} />
          <div className={styles.statusBar}>
            <div className={styles.statusItem}><span className={styles.statusDot} style={{ background: '#22c55e' }} /><span className={styles.statusText}>平台运行正常</span></div>
            <div className={styles.statusItem}><span className={styles.statusDot} style={{ background: '#22c55e' }} /><span className={styles.statusText}>API 服务就绪</span></div>
            <div className={styles.statusItem}><span className={styles.statusDot} style={{ background: '#22c55e' }} /><span className={styles.statusText}>数据库正常</span></div>
          </div>
          <div className={styles.formCenter}>
            <div className={styles.formInner}>
              <div className={styles.formLogo}><img src="/pangolin-logo.png" alt="" style={{ height: 48 }} /></div>
              <div className={styles.formTitle}>创建账号</div>
              <div className={styles.formSub}>请填写信息完成注册</div>
              {tokenError ? (
                <div><Alert type="warning" title="无法注册" description={tokenError} showIcon icon={<SafetyOutlined />} style={{ marginBottom: 16 }} /><Button block onClick={() => history.push('/user/login')} style={{ height: 40 }}>返回登录</Button></div>
              ) : validatingToken ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin /><div style={{ marginTop: 12, color: '#8c8c8c', fontSize: 12 }}>验证邀请令牌…</div></div>
              ) : (
                <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
                  {errorMsg && <Alert title={errorMsg} type="error" showIcon style={{ marginBottom: 12, fontSize: 12 }} />}
                  <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 12, fontSize: 12 }}
                    title="邀请信息已验证"
                    description={`邮箱：${invitationInfo?.email || '-'} · 租户：${invitationInfo?.tenant_name || '-'} · 角色：${invitationInfo?.role_name || '-'}`}
                  />
                  <Form.Item label={<span className={styles.inputLbl}>登录账号</span>} name="username" rules={[{ required: true, message: '请输入账号' }, { min: 3, message: '最少 3 字符' }, { max: 50 }, { pattern: /^[a-zA-Z0-9_.-]+$/, message: '仅支持字母、数字、下划线等' }]} style={{ marginBottom: 12 }}>
                    <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="请设置登录账号" />
                  </Form.Item>
                  <Form.Item label={<span className={styles.inputLbl}>显示名称（选填）</span>} name="display_name" style={{ marginBottom: 12 }}>
                    <Input prefix={<IdcardOutlined style={{ color: '#bfbfbf' }} />} placeholder="如真实姓名或昵称" />
                  </Form.Item>
                  <Form.Item label={<span className={styles.inputLbl}>密码</span>} name="password" rules={[{ required: true, message: '请设置密码' }, { min: 8, message: '至少 8 字符' }]} style={{ marginBottom: 12 }}>
                    <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="至少 8 个字符" />
                  </Form.Item>
                  <Form.Item label={<span className={styles.inputLbl}>确认密码</span>} name="confirm" dependencies={['password']} rules={[{ required: true, message: '请再次输入密码' }, ({ getFieldValue }) => ({ validator(_, v) { if (!v || getFieldValue('password') === v) return Promise.resolve(); return Promise.reject(new Error('两次密码不一致')); } })]} style={{ marginBottom: 14 }}>
                    <Input.Password prefix={<SafetyCertificateOutlined style={{ color: '#bfbfbf' }} />} placeholder="请再次输入密码" />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 12 }}><Button type="primary" htmlType="submit" loading={submitting} block style={{ height: 42, fontSize: 14, fontWeight: 600 }}>注 册</Button></Form.Item>
                  <div style={{ textAlign: 'center' }}><span style={{ fontSize: 12, color: '#8c8c8c' }}>已有账号？</span>{' '}<Link to="/user/login" style={{ fontSize: 12, color: '#2563eb', fontWeight: 500 }}>立即登录</Link></div>
                </Form>
              )}
            </div>
          </div>
          <div className={styles.featureStrip}>
            <div className={styles.featureItem}><CloudServerOutlined className={styles.featureIcon} /><div className={styles.featureText}>多集群管理</div></div>
            <div className={styles.featureItem}><ThunderboltOutlined className={styles.featureIcon} /><div className={styles.featureText}>秒级自愈</div></div>
            <div className={styles.featureItem}><ApartmentOutlined className={styles.featureIcon} /><div className={styles.featureText}>资产拓扑</div></div>
            <div className={styles.featureItem}><ApiOutlined className={styles.featureIcon} /><div className={styles.featureText}>开放 API</div></div>
            <div className={styles.featureItem}><SafetyOutlined className={styles.featureIcon} /><div className={styles.featureText}>安全合规</div></div>
          </div>
          <div className={styles.bottomInfo}>
            <div className={styles.secBadges}>
              <div className={styles.badge}><CheckCircleFilled className={styles.badgeIco} /><span>SSL 加密</span></div>
              <div className={styles.badge}><CheckCircleFilled className={styles.badgeIco} /><span>等保三级</span></div>
              <div className={styles.badge}><CheckCircleFilled className={styles.badgeIco} /><span>SOC 2</span></div>
              <div className={styles.badge}><CheckCircleFilled className={styles.badgeIco} /><span>RBAC</span></div>
            </div>
            <span className={styles.copyright}>Pangolin v6.4.2 · © 2026</span>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default RegisterPage;

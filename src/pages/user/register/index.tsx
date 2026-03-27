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
import { createStyles } from 'antd-style';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import Settings from '../../../../config/defaultSettings';
import { registerByInvitation, type InvitationValidation, validateInvitationToken } from '@/services/auto-healing/auth';
import { buildRegisterResultPath } from './registerHelpers';

const NetworkCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null); const animRef = useRef<number>(0); const nodesRef = useRef<any[]>([]); const init = useRef(false);
  const makeNodes = useCallback((w: number, h: number) => { const a: any[] = []; for (let i = 0; i < 45; i++) a.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: Math.random() * 2 + 1.2, pulse: Math.random() * Math.PI * 2 }); nodesRef.current = a; }, []);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return; const ctx = c.getContext('2d'); if (!ctx) return;
    const resize = () => { const r = c.parentElement?.getBoundingClientRect(); if (r) { c.width = r.width * devicePixelRatio; c.height = r.height * devicePixelRatio; c.style.width = r.width + 'px'; c.style.height = r.height + 'px'; ctx.scale(devicePixelRatio, devicePixelRatio); } };
    resize(); if (!init.current) { const r = c.parentElement?.getBoundingClientRect(); if (r) makeNodes(r.width, r.height); init.current = true; }
    const draw = () => { const r = c.parentElement?.getBoundingClientRect(); if (!r) return; const w = r.width, h = r.height; ctx.clearRect(0, 0, w, h); const ns = nodesRef.current; for (const n of ns) { n.x += n.vx; n.y += n.vy; n.pulse += .015; if (n.x < 0 || n.x > w) n.vx *= -1; if (n.y < 0 || n.y > h) n.vy *= -1; } for (let i = 0; i < ns.length; i++)for (let j = i + 1; j < ns.length; j++) { const dx = ns[i].x - ns[j].x, dy = ns[i].y - ns[j].y, d = Math.sqrt(dx * dx + dy * dy); if (d < 140) { ctx.beginPath(); ctx.moveTo(ns[i].x, ns[i].y); ctx.lineTo(ns[j].x, ns[j].y); ctx.strokeStyle = `rgba(56,189,248,${(1 - d / 140) * .12})`; ctx.lineWidth = .5; ctx.stroke(); } } for (const n of ns) { const g = Math.sin(n.pulse) * .3 + .7; ctx.beginPath(); ctx.arc(n.x, n.y, n.r * g + 1.5, 0, Math.PI * 2); ctx.fillStyle = `rgba(56,189,248,${.06 * g})`; ctx.fill(); ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(56,189,248,${.5 * g})`; ctx.fill(); } animRef.current = requestAnimationFrame(draw); };
    draw(); window.addEventListener('resize', resize); return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, [makeNodes]);
  return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
};

const BrandLogo: React.FC<{ children: React.ReactNode; name: string }> = ({ children, name }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
    <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{children}</div>
    <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>{name}</span>
  </div>
);

const DockerLogo = () => <svg viewBox="0 0 24 24" width="18" height="18"><path d="M13 4h3v3h-3V4zm-5 0h3v3H8V4zm5 4h3v3h-3V8zM8 8h3v3H8V8zm5 4h3v3h-3v-3zM3 8h3v3H3V8zm5 4h3v3H8v-3zM3 12h3v3H3v-3zm18-1.5c-.7-.5-2.2-.5-3 0-.2-1.2-1-2.2-2-2.8l-.5-.3-.3.5c-.4.7-.5 1.8-.2 2.6.2.4.5.9 1 1.2-.5.3-1.3.5-2.5.5H.5l-.1.8c0 1.5.3 3 1 4.2 1 1.5 2.5 2.2 4.5 2.2 3.5 0 6.2-1.6 7.5-4.5.5 0 1.5 0 2-.8.1-.1.3-.5.4-.8l.1-.3-.4-.3z" fill="#2496ed" /></svg>;
const K8sLogo = () => <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 1L3 5.5v5c0 5 3.8 9.7 9 10.5 5.2-.8 9-5.5 9-10.5v-5L12 1z" fill="#326ce5" opacity=".9" /><path d="M12 6l-1 3.3-2.8-2 .7 3.3-3.3.7 2.8 2L5 14.3l3.3.7.7 3.3 2-2.8L12 18l1-2.5 2 2.8.7-3.3 3.3-.7-3.3-1 2.8-2-3.3-.7.7-3.3-2.8 2L12 6z" fill="#fff" opacity=".9" /></svg>;
const RedHatLogo = () => <svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10" fill="#ee0000" /><path d="M7 12c0-1 .5-2 1.5-2.5S11 9 12 9s2.5.5 3.5 1S17 11 17 12s-.5 2-1.5 2.5-2.5.5-3.5.5-2.5-.5-3.5-1S7 13 7 12z" fill="#fff" /></svg>;
const AnsibleLogo = () => <svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10" fill="#1a1918" /><path d="M12 5l-5 11h2.5l2.5-5.5 3 5.5h2.5L12 5z" fill="#fff" /></svg>;
const PrometheusLogo = () => <svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10" fill="#e6522c" /><path d="M12 4a8 8 0 100 16 8 8 0 000-16zm0 2c1 0 2 .5 2 1.5 0 1.5-2 2-2 3v1h-1v-1c0-1 2-1.5 2-3 0-.5-.5-1-1-1s-1 .5-1 1H10c0-1 1-1.5 2-1.5zM11.5 13h1v1h-1v-1z" fill="#fff" opacity=".8" /></svg>;
const GrafanaLogo = () => <svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10" fill="#f46800" /><rect x="7" y="10" width="2" height="6" rx=".5" fill="#fff" /><rect x="11" y="7" width="2" height="9" rx=".5" fill="#fff" /><rect x="15" y="9" width="2" height="7" rx=".5" fill="#fff" /></svg>;
const TerraformLogo = () => <svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 4v6l5 3V7l-5-3z" fill="#7b42bc" /><path d="M15 7v6l5-3V4l-5 3z" fill="#7b42bc" opacity=".6" /><path d="M9 14v6l5 3v-6l-5-3z" fill="#7b42bc" /><path d="M3 7v6l5 3V10L3 7z" fill="#7b42bc" opacity=".4" /></svg>;
const JenkinsLogo = () => <svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="10" fill="#d33833" /><path d="M12 6c-2.2 0-4 1.8-4 4 0 1.5.8 2.8 2 3.5V15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-1.5c1.2-.7 2-2 2-3.5 0-2.2-1.8-4-4-4z" fill="#fff" opacity=".85" /></svg>;
const ElasticLogo = () => <svg viewBox="0 0 24 24" width="18" height="18"><rect x="2" y="2" width="20" height="20" rx="3" fill="#00bfb3" /><path d="M6 8h12M6 12h12M6 16h8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" /></svg>;
const VaultLogo = () => <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2L3 20h18L12 2z" fill="#000" /><path d="M12 7l-5 10h10L12 7z" fill="#ffd814" opacity=".8" /></svg>;

const useStyles = createStyles(({ token }) => ({
  container: { display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, fontFamily: "-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif" },
  leftPanel: { flex: '0 0 55%', background: 'linear-gradient(170deg,#080c18 0%,#0f172a 50%,#111827 100%)', position: 'relative', padding: '36px 48px 0', display: 'flex', flexDirection: 'column', color: '#fff', overflow: 'hidden' },
  topSection: { position: 'relative', zIndex: 2, flexShrink: 0 },
  subBrand: { fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.4)', letterSpacing: 3, marginTop: 10, marginBottom: 20 },
  heroTitle: { fontSize: 30, fontWeight: 700, color: '#fff', lineHeight: 1.35, marginBottom: 10 },
  heroHL: { background: 'linear-gradient(90deg,#38bdf8,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  heroDesc: { fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 2, maxWidth: 500 },
  heroHighlight: { fontWeight: 700, background: 'linear-gradient(90deg, #f97316, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  heroBold: { fontWeight: 600, color: 'rgba(255,255,255,0.7)' },
  spacer: { flex: 1, minHeight: 20 },
  bottomStack: { position: 'relative', zIndex: 2, flexShrink: 0 },
  engineLabel: { fontSize: 11, fontWeight: 600, color: '#38bdf8', letterSpacing: 2, marginBottom: 14, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.06)' },
  engineGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', marginBottom: 18 },
  engineItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0 10px 12px', borderLeft: '3px solid transparent', transition: 'all 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' } },
  ecIcon: { fontSize: 16, flexShrink: 0, width: 20, textAlign: 'center' as const },
  ecText: { flex: 1, minWidth: 0 },
  ecName: { fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 1 },
  ecDesc: { fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.3 },
  metricsRow: { display: 'flex', gap: 0, marginBottom: 0 },
  metricBox: { flex: 1, padding: '12px 0', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)', '&:not(:last-child)': { borderRight: '1px solid rgba(255,255,255,0.08)' } },
  metricNum: { fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 1 }, metricLb: { fontSize: 10, color: 'rgba(255,255,255,0.3)' },
  partnerStrip: { background: 'rgba(0,0,0,0.35)', margin: '0 -48px', padding: '14px 48px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  partnerLabel: { fontSize: 10, color: 'rgba(255,255,255,0.22)', letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase', fontWeight: 600 },
  partnerGrid: { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '6px 8px' },
  rightPanel: { flex: 1, backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' },
  dotBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(circle,rgba(0,0,0,0.03) 1px,transparent 1px)', backgroundSize: '18px 18px', pointerEvents: 'none' },
  statusBar: { position: 'relative', zIndex: 1, display: 'flex', gap: 0, borderBottom: '1px solid #e5e7eb' },
  statusItem: { flex: 1, padding: '10px 12px', textAlign: 'center', borderRight: '1px solid #e5e7eb', '&:last-child': { borderRight: 'none' } },
  statusDot: { display: 'inline-block', width: 6, height: 6, borderRadius: '50%', marginRight: 6, verticalAlign: 'middle' },
  statusText: { fontSize: 11, color: '#6b7280', fontWeight: 500 },
  formCenter: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 1, padding: '0 48px' },
  formInner: { width: '100%', maxWidth: 340 },
  formLogo: { textAlign: 'center', marginBottom: 16 },
  formTitle: { fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4, textAlign: 'center' },
  formSub: { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginBottom: 22 },
  inputLbl: { fontSize: 11, fontWeight: 600, color: '#374151', letterSpacing: .5 },
  helpRow: { display: 'flex', justifyContent: 'center', gap: 16, marginTop: 14 },
  helpLink: { fontSize: 11, color: '#9ca3af', cursor: 'pointer', transition: 'color 0.2s', ':hover': { color: '#2563eb' } },
  featureStrip: { display: 'flex', gap: 0, borderTop: '1px solid #e5e7eb', position: 'relative', zIndex: 1 },
  featureItem: { flex: 1, padding: '11px 6px', textAlign: 'center', borderRight: '1px solid #e5e7eb', '&:last-child': { borderRight: 'none' } },
  featureIcon: { fontSize: 15, color: '#2563eb', display: 'block', marginBottom: 3 }, featureText: { fontSize: 10, color: '#6b7280', fontWeight: 500 },
  bottomInfo: { position: 'relative', zIndex: 1, padding: '10px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  secBadges: { display: 'flex', gap: 12, alignItems: 'center' }, badge: { display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#9ca3af', fontWeight: 500 }, badgeIco: { color: '#22c55e', fontSize: 11 }, copyright: { fontSize: 10, color: '#d1d5db' },
}));

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
      .catch((error: any) => {
        if (requestId !== validationRequestIdRef.current) {
          return;
        }
        const messageText = error?.response?.data?.message || error?.data?.message || error?.message || '邀请不存在或已过期';
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

  const handleSubmit = async (values: any) => {
    setSubmitting(true); setErrorMsg('');
    try {
      await registerByInvitation({ token, username: values.username, password: values.password, display_name: values.display_name || '' });
      message.success('注册成功！');
      redirectTimerRef.current = window.setTimeout(() => {
        history.push(buildRegisterResultPath(values.username));
      }, 1500);
    } catch (e: any) { setErrorMsg(e?.response?.data?.message || e?.data?.message || e?.message || '注册失败'); }
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

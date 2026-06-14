import {
  BugOutlined,
  ClearOutlined,
  DeploymentUnitOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import { Alert, Button, Card, message, Space, Tag } from 'antd';
import React, { useMemo, useState } from 'react';
import {
  createDemoIncident,
  type DemoIncidentResult,
  type DemoScenarioKey,
} from '@/services/auto-healing/demoLab';
import {
  getPlugins,
  type PluginRecord,
  syncPlugin,
} from '@/services/auto-healing/plugins';
import './index.css';

type Scenario = {
  key: DemoScenarioKey;
  title: string;
  description: string;
  mode: string;
  task: string;
  repo: string;
  icon: React.ReactNode;
};

const scenarios: Scenario[] = [
  {
    key: 'clean-logs',
    title: '清理日志',
    description: '生成日志膨胀工单，并注入实验日志文件。',
    mode: '手动执行',
    task: 'Demo Clean Logs Task',
    repo: 'Local Fault Playbooks',
    icon: <ClearOutlined />,
  },
  {
    key: 'kill-process',
    title: '杀死异常进程',
    description: '生成异常进程工单，并注入目标进程。',
    mode: '自动自愈',
    task: 'Demo Kill Process Task',
    repo: 'Local Fault Playbooks',
    icon: <BugOutlined />,
  },
  {
    key: 'blacklist',
    title: '黑名单指令',
    description: '生成高危指令验证工单，任务执行应被拦截。',
    mode: '手动执行',
    task: 'Demo Blacklist Interception Task',
    repo: 'Local Blacklist Demo Playbooks',
    icon: <SafetyCertificateOutlined />,
  },
];

const findItopPlugin = async () => {
  const response = await getPlugins({ page: 1, page_size: 100, type: 'itsm' });
  return (response.data || []).find(
    (plugin: PluginRecord) => plugin.name === 'iTop Adapter ITSM',
  );
};

const DemoLabPage: React.FC = () => {
  const [loadingKey, setLoadingKey] = useState<DemoScenarioKey | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<DemoIncidentResult | null>(null);

  const resultText = useMemo(
    () => (result ? JSON.stringify(result, null, 2) : ''),
    [result],
  );

  const handleCreate = async (scenario: DemoScenarioKey) => {
    setLoadingKey(scenario);
    try {
      const created = await createDemoIncident(scenario);
      setResult(created);
      message.success(`已创建 iTop 工单 ${created.external_id}`);
    } finally {
      setLoadingKey(null);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const plugin = await findItopPlugin();
      if (!plugin) {
        message.error('未找到 iTop Adapter ITSM 插件');
        return;
      }
      await syncPlugin(plugin.id);
      message.success('ITSM 同步已触发');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="demo-lab-page">
      <div className="demo-lab-header">
        <div>
          <h1 className="demo-lab-title">演示造单台</h1>
          <p className="demo-lab-subtitle">
            iTop 工单、故障现场、AHS 同步与执行场景入口
          </p>
        </div>
        <Space wrap>
          <Button
            icon={<SyncOutlined />}
            loading={syncing}
            onClick={handleSync}
          >
            同步 ITSM
          </Button>
          <Button
            icon={<DeploymentUnitOutlined />}
            onClick={() => history.push('/resources/incidents')}
          >
            工单列表
          </Button>
        </Space>
      </div>

      <div className="demo-lab-grid">
        {scenarios.map((scenario) => (
          <Card key={scenario.key} className="demo-lab-card">
            <div className="demo-lab-card-title">
              {scenario.icon}
              <span>{scenario.title}</span>
            </div>
            <div className="demo-lab-card-desc">{scenario.description}</div>
            <div className="demo-lab-meta">
              <span>模式</span>
              <strong>{scenario.mode}</strong>
              <span>任务</span>
              <strong>{scenario.task}</strong>
              <span>仓库</span>
              <strong>{scenario.repo}</strong>
            </div>
            <div className="demo-lab-actions">
              <Button
                type="primary"
                block
                loading={loadingKey === scenario.key}
                onClick={() => handleCreate(scenario.key)}
              >
                生成工单
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {result && (
        <Alert
          className="demo-lab-result"
          type="success"
          showIcon
          message={
            <Space wrap>
              <span>最近创建</span>
              <Tag color="blue">{result.external_id}</Tag>
              <Tag>{result.scenario}</Tag>
              <Tag
                color={result.fault_injection?.ok === false ? 'red' : 'green'}
              >
                {result.fault_injection ? '故障已注入' : '无需注入'}
              </Tag>
            </Space>
          }
          description={<pre>{resultText}</pre>}
        />
      )}
    </div>
  );
};

export default DemoLabPage;

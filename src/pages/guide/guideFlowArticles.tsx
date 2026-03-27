import React from 'react';
import { ApiOutlined, NodeIndexOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { GuideArticle } from './guideTypes';

export const GUIDE_FLOW_ARTICLES: GuideArticle[] = [
  {
    id: 'flow-configure-healing',
    title: '实战: 如何从零拼装自愈流程',
    desc: '端到端流程：从告警接收到自动化恢复通知',
    icon: <ThunderboltOutlined />,
    category: 'flow',
    markdownFile: '/guides/09-flow-configure-healing.md',
    steps: [],
  },
  {
    id: 'flow-connect-incidents',
    title: '实战: 接入第三方工单系统',
    desc: '以 Webhook 为例接入 Prometheus 告警',
    icon: <NodeIndexOutlined />,
    category: 'flow',
    markdownFile: '/guides/10-flow-connect-incidents.md',
    steps: [],
  },
  {
    id: 'flow-develop-inject-plugins',
    title: '实战: 开发并注入一个自定义插件',
    desc: '如何编写胶水层转换非标准告警有效载荷',
    icon: <ApiOutlined />,
    category: 'flow',
    markdownFile: '/guides/11-flow-develop-inject-plugins.md',
    steps: [],
  },
];

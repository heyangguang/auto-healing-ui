import React from 'react';
import { Avatar, Badge, Progress, Tag, Tooltip, Typography } from 'antd';

const { Text } = Typography;

export const AreaChart: React.FC<{
  data: number[];
  labels: string[];
  color: string;
  height?: number;
}> = ({ data, labels, color, height = 140 }) => {
  if (!data || data.length < 2) {
    return (
      <svg role="img" viewBox={`0 0 300 ${height}`} style={{ width: '100%', height }}>
        <title>暂无数据</title>
        <text x="150" y={height / 2} textAnchor="middle" fontSize={12} fill="#d9d9d9">
          暂无数据
        </text>
      </svg>
    );
  }

  const padding = { top: 12, right: 12, bottom: 24, left: 12 };
  const width = 300;
  const plotHeight = height - padding.top - padding.bottom;
  const plotWidth = width - padding.left - padding.right;
  const maxValue = Math.max(...data, 1) * 1.1;
  const points = data.map((value, index) => ({
    x: padding.left + (index / (data.length - 1)) * plotWidth,
    y: padding.top + plotHeight - (value / maxValue) * plotHeight,
  }));
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${padding.top + plotHeight} L${points[0].x},${padding.top + plotHeight} Z`;
  const gradientId = `tenant-overview-${color.replace('#', '')}`;

  return (
    <svg role="img" viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height }}>
      <title>数据趋势图</title>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
        <line
          key={ratio}
          x1={padding.left}
          x2={padding.left + plotWidth}
          y1={padding.top + plotHeight * (1 - ratio)}
          y2={padding.top + plotHeight * (1 - ratio)}
          stroke="#f0f0f0"
          strokeWidth={0.5}
        />
      ))}
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point, index) => (
        <g key={labels[index]}>
          <circle cx={point.x} cy={point.y} r={3.5} fill="#fff" stroke={color} strokeWidth={2} />
          <title>{`${labels[index]}: ${data[index]}`}</title>
        </g>
      ))}
      {labels.map((label, index) => (
        <text
          key={label}
          x={padding.left + (index / (labels.length - 1)) * plotWidth}
          y={height - 4}
          textAnchor="middle"
          fontSize={10}
          fill="#bfbfbf"
        >
          {label}
        </text>
      ))}
    </svg>
  );
};

export const RingGrid: React.FC<{
  items: { label: string; value: number; color: string; sub?: string }[];
}> = ({ items }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, justifyItems: 'center' }}>
    {items.map((item) => (
      <div key={item.label} style={{ textAlign: 'center' }}>
        <Progress
          type="circle"
          size={68}
          percent={item.value}
          strokeColor={item.color}
          strokeWidth={7}
          format={(percent) => (
            <span style={{ fontSize: 15, fontWeight: 700, color: '#262626' }}>{percent}%</span>
          )}
        />
        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 500, color: '#595959' }}>{item.label}</div>
        {item.sub ? <div style={{ fontSize: 11, color: '#bfbfbf' }}>{item.sub}</div> : null}
      </div>
    ))}
  </div>
);

export const ResourceBar: React.FC<{
  items: { label: string; value: number; color: string }[];
}> = ({ items }) => {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        height: 8,
        borderRadius: 0,
        overflow: 'hidden',
        background: '#f5f5f5',
      }}
    >
      {items.map((item) => (
        <Tooltip key={item.label} title={`${item.label}: ${item.value}`}>
          <div
            style={{
              flex: Math.max(item.value / total, 0.02),
              background: item.color,
              minWidth: item.value > 0 ? 6 : 0,
              transition: 'flex 0.3s',
            }}
          />
        </Tooltip>
      ))}
    </div>
  );
};

export const ListRow: React.FC<{
  name: string;
  percent: number;
  value: React.ReactNode;
  barColor: string;
  barContent?: React.ReactNode;
}> = ({ name, percent, value, barColor, barContent }) => (
  <div className="ov-list-row">
    <Text strong className="ov-list-name">{name}</Text>
    <div style={{ flex: 1, minWidth: 0 }}>
      {barContent ?? (
        <Progress percent={percent} size="small" strokeColor={barColor} showInfo={false} style={{ margin: 0 }} />
      )}
    </div>
    <div className="ov-list-value">{value}</div>
  </div>
);

export const RankItem: React.FC<{
  rank: number;
  name: string;
  code: string;
  status: string;
  id: string;
  value: number;
  maxValue: number;
  color: string;
  details?: { label: string; value: number; color: string }[];
  onSelect: (tenantId: string) => void;
}> = ({ rank, name, code, status, id, value, maxValue, color, details, onSelect }) => {
  const percent = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
  const rankColor = rank <= 3 ? ['#ff4d4f', '#fa8c16', '#faad14'][rank - 1] : '#f0f0f0';
  const textColor = rank <= 3 ? '#fff' : '#8c8c8c';

  return (
    <div className="ov-rank-row" onClick={() => onSelect(id)}>
      <Avatar size={26} style={{ background: rankColor, color: textColor, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
        {rank}
      </Avatar>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <Text strong style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </Text>
          <Badge status={status === 'active' ? 'success' : 'default'} />
          <Tag style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px', borderRadius: 2 }}>{code}</Tag>
        </div>
        <Progress percent={percent} size="small" strokeColor={color} showInfo={false} style={{ margin: 0 }} />
      </div>
      {details ? (
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {details.map((detail) => (
            <Tooltip key={detail.label} title={detail.label}>
              <span style={{ fontSize: 13, fontWeight: 600, color: detail.value > 0 ? detail.color : '#e0e0e0' }}>
                {detail.value}
              </span>
            </Tooltip>
          ))}
        </div>
      ) : null}
      <div style={{ width: 50, textAlign: 'right', flexShrink: 0 }}>
        <Text strong style={{ fontSize: 15, color }}>{value}</Text>
      </div>
    </div>
  );
};

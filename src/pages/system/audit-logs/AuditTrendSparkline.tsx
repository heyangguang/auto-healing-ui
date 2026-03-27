import React from 'react';
import type { TrendPoint } from './types';

const SPARKLINE_WIDTH = 160;
const SPARKLINE_HEIGHT = 40;
const SPARKLINE_PADDING = 2;
const SPARKLINE_STROKE_WIDTH = 1.5;
const MIN_SPARKLINE_COUNT = 1;

type AuditTrendSparklineProps = {
  data: TrendPoint[];
  gradientId: string;
  strokeColor: string;
  className?: string;
};

const AuditTrendSparkline: React.FC<AuditTrendSparklineProps> = ({
  className,
  data,
  gradientId,
  strokeColor,
}) => {
  if (data.length === 0) {
    return null;
  }

  const maxCount = Math.max(...data.map((point) => point.count), MIN_SPARKLINE_COUNT);
  const points = data.map((point, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * SPARKLINE_WIDTH;
    const y =
      SPARKLINE_HEIGHT
      - (point.count / maxCount) * (SPARKLINE_HEIGHT - SPARKLINE_PADDING * 2)
      - SPARKLINE_PADDING;
    return `${x},${y}`;
  });
  const areaPoints = [...points, `${SPARKLINE_WIDTH},${SPARKLINE_HEIGHT}`, `0,${SPARKLINE_HEIGHT}`];

  return (
    <svg
      width={SPARKLINE_WIDTH}
      height={SPARKLINE_HEIGHT}
      viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints.join(' ')} fill={`url(#${gradientId})`} />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={strokeColor}
        strokeWidth={SPARKLINE_STROKE_WIDTH}
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default AuditTrendSparkline;

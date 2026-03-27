import React from 'react';

/**
 * Docker 执行图标 — 简洁 Docker 鲸鱼 logo
 * 方正直角风格
 */
export const DockerExecIcon: React.FC<{
    size?: number; color?: string; style?: React.CSSProperties;
}> = ({ size = 20, color = '#1890ff', style }) => (
    <svg role="img" width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
        <title>Docker 执行图标</title>
        {/* 鲸鱼身体 */}
        <path d="M21.81 10.95c-.06-.04-.56-.43-1.64-.43-.28 0-.56.03-.84.08-.21-1.4-1.38-2.1-1.43-2.13l-.29-.17-.18.28c-.23.36-.4.77-.46 1.19-.12.78.05 1.52.46 2.14-.67.38-1.77.47-2 .47H1.53a.52.52 0 0 0-.52.53c-.02 1.97.31 3.94 1.36 5.55A6.24 6.24 0 0 0 7.6 21c3.76 0 7.2-1.73 9.63-5.26A7.85 7.85 0 0 0 21 15.78c.78 0 1.35-.2 1.63-.37.22-.13.6-.43.81-.91l.1-.26-.73-.29z"
            fill={color} opacity={0.85} />
        {/* 容器方块 - 第一行 */}
        <rect x="5" y="7" width="2.4" height="2.2" fill={color} opacity={0.9} />
        <rect x="8" y="7" width="2.4" height="2.2" fill={color} opacity={0.9} />
        <rect x="11" y="7" width="2.4" height="2.2" fill={color} opacity={0.9} />
        {/* 容器方块 - 第二行 */}
        <rect x="5" y="4.2" width="2.4" height="2.2" fill={color} opacity={0.7} />
        <rect x="8" y="4.2" width="2.4" height="2.2" fill={color} opacity={0.7} />
        <rect x="11" y="4.2" width="2.4" height="2.2" fill={color} opacity={0.7} />
        {/* 顶部一格 */}
        <rect x="11" y="1.4" width="2.4" height="2.2" fill={color} opacity={0.5} />
    </svg>
);

/**
 * Shell / 本地执行图标 — 终端命令行风格
 * 方正直角风格，无圆角
 */
export const LocalExecIcon: React.FC<{
    size?: number; color?: string; style?: React.CSSProperties;
}> = ({ size = 20, color = '#595959', style }) => (
    <svg role="img" width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
        <title>本地执行图标</title>
        {/* 终端窗口 — 直角 */}
        <rect x="2" y="4" width="20" height="16" stroke={color} strokeWidth="1.5" fill="none" />
        {/* 标题栏 */}
        <rect x="2" y="4" width="20" height="3.5" fill={color} opacity={0.12} />
        {/* 提示符 > */}
        <polyline points="6,11.5 9.5,14 6,16.5" stroke={color} strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
        {/* 光标线 */}
        <line x1="11.5" y1="16.5" x2="18" y2="16.5" stroke={color} strokeWidth="2" strokeLinecap="square" opacity={0.4} />
    </svg>
);

/**
 * 任务模板蓝图图标
 */
export const TemplateBlueprintIcon: React.FC<{
    size?: number; color?: string; style?: React.CSSProperties;
}> = ({ size = 22, color = '#1890ff', style }) => (
    <svg role="img" width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
        <title>任务模板图标</title>
        <path d="M6 3H15L19 7V19C19 20.1 18.1 21 17 21H6C4.9 21 4 20.1 4 19V5C4 3.9 4.9 3 6 3Z"
            stroke={color} strokeWidth="1.5" fill="none" />
        <path d="M15 3V7H19" stroke={color} strokeWidth="1.2" fill="none" />
        <path d="M10 10L13 10L11.5 13.5L14 13L10 18L11 14L9 14.5Z"
            fill={color} opacity={0.7} />
    </svg>
);

/**
 * 图标容器 — 方正直角，无圆角
 */
export const IconBox: React.FC<{
    bg: string; children: React.ReactNode; size?: number;
}> = ({ bg, children, size = 36 }) => (
    <div style={{
        width: size, height: size,
        background: bg,
        borderRadius: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    }}>
        {children}
    </div>
);

/**
 * 根据 executor_type 返回对应图标+背景
 * 直角方正风格
 */
export const ExecutorIcon: React.FC<{
    executorType?: string; size?: number; iconSize?: number;
}> = ({ executorType, size = 36, iconSize = 20 }) => {
    const isDocker = executorType === 'docker';
    return (
        <IconBox
            bg={isDocker ? '#e6f7ff' : '#f5f5f5'}
            size={size}
        >
            {isDocker
                ? <DockerExecIcon size={iconSize} />
                : <LocalExecIcon size={iconSize} />
            }
        </IconBox>
    );
};

import React from 'react';

/** 从英文用户名提取缩写（最多2个字母） */
function getInitials(seed: string): string {
    if (!seed) return '?';
    const trimmed = seed.trim();
    // 按 _ - . 空格拆分
    const words = trimmed.split(/[\s_\-\.]+/).filter(Boolean);
    if (words.length >= 2) {
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
}

interface TeamsAvatarProps {
    /** 英文用户名/种子，用于提取缩写 */
    seed: string;
    /** 显示名称（保留接口兼容） */
    name?: string;
    /** 尺寸 px，默认 32 */
    size?: number;
}

/**
 * Teams 风格直角头像
 * 统一超浅灰蓝背景 + 深靛蓝英文缩写
 */
const TeamsAvatar: React.FC<TeamsAvatarProps> = ({ seed, size = 32 }) => {
    const initials = getInitials(seed);
    const fontSize = initials.length > 1 ? Math.round(size * 0.36) : Math.round(size * 0.44);

    return (
        <div style={{
            width: size,
            height: size,
            backgroundColor: '#ECEDF5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#5B5FC7',
            fontWeight: 600,
            fontSize,
            lineHeight: 1,
            userSelect: 'none',
            fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
        }}>
            {initials}
        </div>
    );
};

export default TeamsAvatar;

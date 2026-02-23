import React, { useMemo } from 'react';
import { Button, Empty, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

/**
 * JSON 代码查看器 — GitHub Dark 深色主题 + 自动换行 + 内联语法着色
 */

// 着色方案 (GitHub Dark)
const COLORS = {
    key: '#79c0ff',       // 蓝色 key
    str: '#a5d6ff',       // 浅蓝字符串
    num: '#79c0ff',       // 蓝色数字
    bool: '#ff7b72',      // 红色布尔
    nul: '#d2a8ff',       // 紫色 null
    brace: '#8b949e',     // 灰色括号
    colon: '#8b949e',     // 灰色冒号
    comma: '#8b949e',     // 灰色逗号
};

const syntaxHighlight = (json: string): string => {
    // 先 HTML 转义
    const lines = json.split('\n');
    const result: string[] = [];

    for (const line of lines) {
        let highlighted = '';
        let i = 0;
        const chars = line;

        while (i < chars.length) {
            const ch = chars[i];

            // 空白
            if (ch === ' ' || ch === '\t') {
                highlighted += ch;
                i++;
                continue;
            }

            // 括号 { } [ ]
            if (ch === '{' || ch === '}' || ch === '[' || ch === ']') {
                highlighted += `<span style="color:${COLORS.brace}">${ch}</span>`;
                i++;
                continue;
            }

            // 逗号
            if (ch === ',') {
                highlighted += `<span style="color:${COLORS.comma}">,</span>`;
                i++;
                continue;
            }

            // 冒号
            if (ch === ':') {
                highlighted += `<span style="color:${COLORS.colon}">:</span>`;
                i++;
                continue;
            }

            // 字符串 (可能是 key 或 value)
            if (ch === '"') {
                let str = '"';
                i++;
                while (i < chars.length) {
                    if (chars[i] === '\\' && i + 1 < chars.length) {
                        str += chars[i] + chars[i + 1];
                        i += 2;
                    } else if (chars[i] === '"') {
                        str += '"';
                        i++;
                        break;
                    } else {
                        str += chars[i];
                        i++;
                    }
                }

                // 判断是 key 还是 value — key 后面紧跟 `: ` 或 `:`
                const restTrimmed = chars.substring(i).trimStart();
                const isKey = restTrimmed.startsWith(':');

                // HTML 转义字符串内容
                const escaped = str
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');

                const color = isKey ? COLORS.key : COLORS.str;
                highlighted += `<span style="color:${color}">${escaped}</span>`;
                continue;
            }

            // 数字
            if (ch === '-' || (ch >= '0' && ch <= '9')) {
                let num = ch;
                i++;
                while (i < chars.length && /[\d.eE+\-]/.test(chars[i])) {
                    num += chars[i];
                    i++;
                }
                highlighted += `<span style="color:${COLORS.num};font-weight:500">${num}</span>`;
                continue;
            }

            // true / false / null
            const rest = chars.substring(i);
            const kwMatch = rest.match(/^(true|false|null)\b/);
            if (kwMatch) {
                const kw = kwMatch[1];
                const color = kw === 'null' ? COLORS.nul : COLORS.bool;
                const fontStyle = kw === 'null' ? ';font-style:italic' : '';
                highlighted += `<span style="color:${color}${fontStyle}">${kw}</span>`;
                i += kw.length;
                continue;
            }

            // 其他字符
            const escaped = ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch;
            highlighted += escaped;
            i++;
        }

        result.push(highlighted);
    }

    return result.join('\n');
};

const JsonPrettyView: React.FC<{ data: any }> = ({ data }) => {
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
        return <Empty description="暂无数据" style={{ padding: '30px 0' }} />;
    }

    const jsonStr = useMemo(() => JSON.stringify(data, null, 2), [data]);
    const highlighted = useMemo(() => syntaxHighlight(jsonStr), [jsonStr]);
    const fieldCount = typeof data === 'object' ? Object.keys(data).length : 0;

    return (
        <div style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid #30363d' }}>
            {/* 顶部工具栏 */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 14px',
                background: '#161b22',
                borderBottom: '1px solid #30363d',
            }}>
                <span style={{ fontSize: 11, color: '#8b949e', fontFamily: 'monospace' }}>
                    JSON · {fieldCount} 字段
                </span>
                <Button
                    size="small"
                    type="text"
                    icon={<CopyOutlined />}
                    style={{ color: '#8b949e', fontSize: 11, height: 22 }}
                    onClick={() => { navigator.clipboard.writeText(jsonStr); message.success('已复制'); }}
                >
                    复制
                </Button>
            </div>

            {/* 代码区域 */}
            <pre
                style={{
                    margin: 0,
                    padding: '14px 18px',
                    background: '#0d1117',
                    fontSize: 12,
                    lineHeight: 1.7,
                    fontFamily: "'SF Mono', Menlo, Monaco, Consolas, monospace",
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    overflowWrap: 'break-word',
                    maxHeight: 500,
                    overflow: 'auto',
                    color: '#c9d1d9',
                }}
                dangerouslySetInnerHTML={{ __html: highlighted }}
            />
        </div>
    );
};

export default JsonPrettyView;

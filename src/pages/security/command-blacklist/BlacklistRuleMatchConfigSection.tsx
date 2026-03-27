import React from 'react';
import { Col, Form, Input, Row } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd/es/form';
import type { CommandBlacklistRule } from '@/services/auto-healing/commandBlacklist';
import { MATCH_TYPE_OPTIONS } from './blacklistRuleFormOptions';

const { TextArea } = Input;

type Props = {
    form: FormInstance;
    isSystem: boolean;
    patternValue?: string;
    selectedMatchType: CommandBlacklistRule['match_type'];
    onMatchTypeChange: (value: CommandBlacklistRule['match_type']) => void;
};

const getMatchPatternExtra = (matchType: CommandBlacklistRule['match_type']) => {
    if (matchType === 'regex') {
        return '请输入有效的正则表达式，将逐行匹配文件内容';
    }
    if (matchType === 'exact') {
        return '整行内容去掉首尾空格后必须完全等于此文本才算命中（不是子串包含）';
    }
    return '扫描时检查每一行是否包含该文本片段';
};

const getMatchPatternPlaceholder = (matchType: CommandBlacklistRule['match_type']) => {
    if (matchType === 'regex') {
        return '如：dd\\s+if=.*\\s+of=/dev/';
    }
    if (matchType === 'exact') {
        return '如：init 0';
    }
    return '如：rm -rf /';
};

const BlacklistRuleMatchConfigSection: React.FC<Props> = ({
    form,
    isSystem,
    patternValue,
    selectedMatchType,
    onMatchTypeChange,
}) => (
    <div className="blacklist-form-card">
        <h4 className="blacklist-form-section-title">
            <SettingOutlined />
            匹配配置
        </h4>

        <Form.Item label="匹配类型" required extra="选择规则的匹配策略，不同类型适用于不同场景">
            <div className="blacklist-match-type-cards">
                {MATCH_TYPE_OPTIONS.map((option) => (
                    <div
                        key={option.value}
                        className={`blacklist-match-type-card ${selectedMatchType === option.value ? 'active' : ''} ${isSystem ? 'disabled' : ''}`}
                        onClick={() => {
                            if (isSystem) {
                                return;
                            }
                            onMatchTypeChange(option.value);
                            form.setFieldsValue({ match_type: option.value });
                        }}
                        aria-disabled={isSystem}
                        style={isSystem ? { cursor: 'not-allowed', opacity: 0.55 } : undefined}
                    >
                        <div className="blacklist-match-type-card-icon">{option.icon}</div>
                        <div>
                            <div className="blacklist-match-type-card-title">{option.label}</div>
                            <div className="blacklist-match-type-card-desc">{option.desc}</div>
                        </div>
                    </div>
                ))}
            </div>
        </Form.Item>

        <Row gutter={16}>
            <Col span={16}>
                <Form.Item
                    name="pattern"
                    label="匹配模式"
                    rules={[{ required: true, message: '请输入匹配模式' }]}
                    extra={getMatchPatternExtra(selectedMatchType)}
                >
                    <TextArea
                        placeholder={getMatchPatternPlaceholder(selectedMatchType)}
                        rows={3}
                        style={{ fontFamily: "'SFMono-Regular', Consolas, monospace", fontSize: 13 }}
                        disabled={isSystem}
                    />
                </Form.Item>
            </Col>
            <Col span={8}>
                {patternValue && (
                    <div className="blacklist-pattern-preview">
                        <div className="blacklist-pattern-preview-label">模式预览</div>
                        <code className="blacklist-pattern-preview-code">{patternValue}</code>
                    </div>
                )}
            </Col>
        </Row>
    </div>
);

export default BlacklistRuleMatchConfigSection;

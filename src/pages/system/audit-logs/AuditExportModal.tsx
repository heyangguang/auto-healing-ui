import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Button, DatePicker, Form, Input, message, Modal, Select, Space, Tag } from 'antd';
import { DownloadOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { exportAuditLogs } from '@/services/auto-healing/auditLogs';
import {
  ACTION_LABELS,
  TENANT_RESOURCE_LABELS as RESOURCE_LABELS,
} from '@/constants/auditDicts';
import { AUDIT_RESULT_OPTIONS } from '@/constants/commonDicts';
import { buildAuditExportParams, extractAuditExportBlob } from './helpers';
import { useAuditExportPreview } from './useAuditExportPreview';
import type { AuditCategory, AuditExportValues } from './types';

const AUDIT_RISK_LEVEL_OPTIONS = [
  { label: '高危', value: 'high' },
  { label: '普通', value: 'normal' },
];

type AuditExportModalProps = {
  open: boolean;
  category: AuditCategory;
  onClose: () => void;
};

const AuditExportPreview: React.FC<{ loading: boolean; count: number | null }> = ({ loading, count }) => {
  if (count === null && !loading) return null;
  const previewCount = count ?? 0;
  return (
    <div className="audit-export-preview">
      {loading ? (
        <span style={{ color: '#8c8c8c' }}>正在查询匹配记录数...</span>
      ) : (
        <>
          <span>符合条件的日志：</span>
          <strong style={{ fontSize: 16, color: previewCount > 10000 ? '#ff4d4f' : '#1677ff' }}>
            {previewCount.toLocaleString()}
          </strong>
          <span> 条</span>
          {previewCount > 10000 && <Tag color="error" style={{ marginLeft: 8 }}>超出上限，仅导出前 10,000 条</Tag>}
          {previewCount === 0 && <Tag color="warning" style={{ marginLeft: 8 }}>无匹配数据</Tag>}
        </>
      )}
    </div>
  );
};

const AuditExportModal: React.FC<AuditExportModalProps> = ({ open, category, onClose }) => {
  const [form] = Form.useForm<AuditExportValues>();
  const [exporting, setExporting] = useState(false);
  const formValues = Form.useWatch([], form) as AuditExportValues | undefined;
  const hasExportCondition = useMemo(() => {
    if (!formValues) return false;
    const { date_range, action, resource_type, username, status, risk_level } = formValues;
    return Boolean((date_range?.[0] && date_range[1]) || action || resource_type || username || status || risk_level);
  }, [formValues]);
  const { previewCount, previewLoading } = useAuditExportPreview({
    open,
    hasExportCondition,
    values: formValues,
    category,
  });

  const closeModal = useCallback(() => {
    onClose();
    form.resetFields();
  }, [form, onClose]);

  const handleExportSubmit = useCallback(async () => {
    const values = form.getFieldsValue();
    setExporting(true);
    try {
      const response = await exportAuditLogs(buildAuditExportParams(values, category)) as Blob | { data: Blob };
      const blob = extractAuditExportBlob(response);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `audit_logs_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
      anchor.click();
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
      closeModal();
    } finally {
      setExporting(false);
    }
  }, [category, closeModal, form]);

  return (
    <Modal
      title="导出审计日志"
      open={open}
      onCancel={closeModal}
      width={520}
      destroyOnHidden
      footer={
        <Space>
          <Button onClick={closeModal}>取消</Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            loading={exporting}
            disabled={!hasExportCondition}
            onClick={handleExportSubmit}
          >
            导出 CSV
          </Button>
        </Space>
      }
    >
      <Alert
        type="info"
        showIcon
        message="请至少选择一个筛选条件，单次导出上限 10,000 条记录。"
        style={{ marginBottom: 16 }}
      />
      <Form form={form} layout="vertical" size="middle">
        <Form.Item label="时间范围" name="date_range">
          <DatePicker.RangePicker
            showTime
            style={{ width: '100%' }}
            placeholder={['开始时间', '结束时间']}
            presets={[
              { label: '今天', value: [dayjs().startOf('day'), dayjs()] },
              { label: '近 7 天', value: [dayjs().subtract(7, 'day').startOf('day'), dayjs()] },
              { label: '近 30 天', value: [dayjs().subtract(30, 'day').startOf('day'), dayjs()] },
              { label: '近 90 天', value: [dayjs().subtract(90, 'day').startOf('day'), dayjs()] },
            ]}
          />
        </Form.Item>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Form.Item label="操作类型" name="action" style={{ marginBottom: 12 }}>
            <Select allowClear placeholder="全部操作" options={Object.entries(ACTION_LABELS).map(([value, label]) => ({ label, value }))} />
          </Form.Item>
          <Form.Item label="资源类型" name="resource_type" style={{ marginBottom: 12 }}>
            <Select allowClear placeholder="全部资源" options={Object.entries(RESOURCE_LABELS).map(([value, label]) => ({ label, value }))} />
          </Form.Item>
          <Form.Item label="用户名" name="username" style={{ marginBottom: 12 }}>
            <Input allowClear placeholder="输入用户名" prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item label="状态" name="status" style={{ marginBottom: 12 }}>
            <Select allowClear placeholder="全部状态" options={AUDIT_RESULT_OPTIONS} />
          </Form.Item>
          <Form.Item label="风险等级" name="risk_level" style={{ marginBottom: 0 }}>
            <Select allowClear placeholder="全部" options={AUDIT_RISK_LEVEL_OPTIONS} />
          </Form.Item>
        </div>
      </Form>
      {hasExportCondition && <AuditExportPreview loading={previewLoading} count={previewCount} />}
    </Modal>
  );
};

export default AuditExportModal;

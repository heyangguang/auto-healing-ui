export const FIXED_PAGE_SIZE = 15;
export const HOST_CHIP_MAX = 50;

export const envConfig: Record<string, { label: string; color: string }> = {
    production: { label: '生产', color: '#f5222d' },
    staging: { label: '预发', color: '#fa8c16' },
    dev: { label: '开发', color: '#1890ff' },
    test: { label: '测试', color: '#52c41a' },
};

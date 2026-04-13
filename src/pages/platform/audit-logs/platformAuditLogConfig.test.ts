import { ACTION_LABELS, PLATFORM_RESOURCE_LABELS } from '@/constants/auditDicts';
import { operationAdvancedSearchFields } from './platformAuditLogSearchConfig';
import { createPlatformAuditLogColumns } from './platformAuditLogTableConfig';

describe('platform audit log config', () => {
  it('maps auth-register and keeps auth resources out of operation filters', () => {
    expect(PLATFORM_RESOURCE_LABELS['auth-register']).toBe('注册');
    expect(ACTION_LABELS.register).toBe('注册');

    const resourceField = operationAdvancedSearchFields.find((field) => field.key === 'resource_type');
    expect(resourceField?.type).toBe('select');
    expect(resourceField?.options).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ value: 'auth-register' }),
      ]),
    );

    const { operationColumns } = createPlatformAuditLogColumns();
    const resourceColumn = operationColumns.find((column) => column.columnKey === 'resource_type');
    expect(resourceColumn?.headerFilters).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ value: 'auth-register' }),
      ]),
    );
  });
});

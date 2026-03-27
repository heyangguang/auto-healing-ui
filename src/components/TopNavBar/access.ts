import { canAccessPath } from '@/utils/pathAccess';
import type { ServiceItem } from '@/config/navData';

export type AccessMap = Record<string, boolean>;

export const hasServiceAccess = (svc: ServiceItem, access: AccessMap): boolean => {
    if (svc.accesses?.length) {
        return svc.accesses.every((key) => !key || Boolean(access[key]));
    }
    if (svc.access) {
        return Boolean(access[svc.access]);
    }
    return canAccessPath(svc.path, access);
};

export const hasAnyVisibleService = (services: Record<string, ServiceItem[]>, access: AccessMap): boolean =>
    Object.values(services).some((items) => items.some((svc) => hasServiceAccess(svc, access)));

export const readImpersonationActive = (): boolean => {
    try {
        const raw = localStorage.getItem('impersonation-storage');
        if (!raw) {
            return false;
        }
        const parsed = JSON.parse(raw) as { isImpersonating?: boolean; session?: { expiresAt?: string } };
        if (!parsed.isImpersonating || !parsed.session?.expiresAt) {
            return false;
        }
        return new Date(parsed.session.expiresAt) > new Date();
    } catch {
        return false;
    }
};

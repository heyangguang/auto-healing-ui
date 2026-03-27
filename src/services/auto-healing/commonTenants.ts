import { request } from '@umijs/max';
import { unwrapItems } from './responseAdapters';

export type CurrentUserTenant = AutoHealing.TenantBrief & {
    icon?: string;
};

export type CurrentUserTenantsQuery = {
    name?: string;
};

type CurrentUserTenantsResponse =
    | CurrentUserTenant[]
    | {
        data?: CurrentUserTenant[];
    };

export async function getCurrentUserTenants(
    params: CurrentUserTenantsQuery = {},
) {
    const response = await request<CurrentUserTenantsResponse>(
        '/api/v1/common/user/tenants',
        {
            method: 'GET',
            params,
        },
    );

    return unwrapItems<CurrentUserTenant>(response);
}

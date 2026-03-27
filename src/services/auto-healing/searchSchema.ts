import { request } from '@umijs/max';

export interface SearchSchemaOption {
    label: string;
    value: string;
}

export interface SearchSchemaField {
    key?: string;
    label?: string;
    type?: string;
    placeholder?: string;
    description?: string;
    default_match_mode?: 'exact' | 'fuzzy' | string;
    options?: SearchSchemaOption[];
}

export interface SearchSchemaEnvelope {
    fields?: SearchSchemaField[];
    data?: {
        fields?: SearchSchemaField[];
    };
}

export type SearchSchemaRequest = () => Promise<SearchSchemaEnvelope>;

export async function getSearchSchema(path: string) {
    return request<SearchSchemaEnvelope>(path, {
        method: 'GET',
    });
}

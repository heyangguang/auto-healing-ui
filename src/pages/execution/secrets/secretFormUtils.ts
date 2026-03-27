import type { FormInstance } from 'antd';
import type { SecretFormValues } from './secretFormConfig';

export const EDIT_LOAD_ERROR_MESSAGE = '加载密钥源详情失败';
export const EDIT_NOT_READY_MESSAGE = '密钥源详情尚未加载完成，无法保存';

export function clearFormFields(form: FormInstance<SecretFormValues>, fieldNames: string[]) {
    form.setFieldsValue(Object.fromEntries(fieldNames.map((fieldName) => [fieldName, undefined])));
}

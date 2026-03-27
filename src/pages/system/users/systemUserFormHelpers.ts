export type SystemUserFormValues = {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  display_name?: string;
  role_id?: string;
};

export const isFormValidationError = (error: unknown): error is { errorFields: unknown } =>
  typeof error === 'object' && error !== null && 'errorFields' in error;

export const buildCreateUserPayload = (
  values: SystemUserFormValues,
): AutoHealing.CreateUserRequest => ({
  username: values.username,
  email: values.email,
  password: values.password,
  display_name: values.display_name,
});

export const buildUpdateUserPayload = (values: SystemUserFormValues) => ({
  role_id: values.role_id || '',
});

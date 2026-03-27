export type RegisterFormValues = {
  username: string;
  password: string;
  display_name?: string;
  confirm: string;
};

type ApiErrorShape = {
  response?: { data?: { message?: string } };
  data?: { message?: string };
  message?: string;
};

export type NetworkNode = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  pulse: number;
};

export const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiErrorShape;
  return (
    apiError?.response?.data?.message ||
    apiError?.data?.message ||
    apiError?.message ||
    fallback
  );
};

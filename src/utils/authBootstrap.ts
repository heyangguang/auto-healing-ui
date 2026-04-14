export type RefreshFailureReason =
  | 'missing_refresh_token'
  | 'unauthorized'
  | 'server_error'
  | 'network_error'
  | 'invalid_response';

type ErrorWithResponse = {
  response?: { status?: number };
};

export function isAuthFailureStatus(status?: number): boolean {
  return status === 401;
}

export function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }
  return (error as ErrorWithResponse).response?.status;
}

export function shouldClearTokensAfterBootstrapFailure(
  userInfoError: unknown,
  refreshFailureReason?: RefreshFailureReason,
): boolean {
  if (isAuthFailureStatus(getErrorStatus(userInfoError))) {
    return true;
  }
  return refreshFailureReason === 'unauthorized';
}

export const __TEST_ONLY__ = {
  getErrorStatus,
};

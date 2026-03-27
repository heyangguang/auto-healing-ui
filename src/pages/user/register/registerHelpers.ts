export function buildRegisterResultPath(account: string): string {
  return `/user/register-result?account=${encodeURIComponent(account)}`;
}

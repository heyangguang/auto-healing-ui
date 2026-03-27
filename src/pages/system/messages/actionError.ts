export function reportSystemMessageActionError(action: string, error: unknown) {
  console.error(`[system-messages] ${action}失败`, error);
}

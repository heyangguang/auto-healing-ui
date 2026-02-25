/**
 * 从后端错误响应中提取友好的错误信息
 *
 * 后端有三种错误格式：
 * 1. { error: { code: "...", message: "..." } }  — response.Error() 标准格式
 * 2. { error: "错误信息" }                        — gin.H{} 简单格式
 * 3. { message: "错误信息" }                      — 部分旧接口
 *
 * umi-request 抛出的 error 对象中 response.data 包含上述结构
 */
export function extractErrorMsg(err: any, fallback: string): string {
    // 全局 errorHandler 挂载的后端消息（最高优先级）
    if (typeof err?._backendMessage === 'string' && err._backendMessage) return err._backendMessage;
    // 来自 umi-request 的错误
    const data = err?.response?.data || err?.data;
    if (data) {
        const raw = data.error;
        if (typeof raw === 'string' && raw) return raw;
        if (raw?.message) return raw.message;
        if (typeof data.message === 'string' && data.message) return data.message;
    }
    // 普通 JS Error
    if (typeof err?.message === 'string' && err.message && !err.message.includes('status code')) {
        return err.message;
    }
    return fallback;
}

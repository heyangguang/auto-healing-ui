/**
 * 站内信 Mock 服务
 * 独立于通知管理模块（notification.ts），不影响原有渠道/模板/发送记录功能
 */

export interface SiteMessage {
    id: string;
    category: string;
    title: string;
    content: string;
    date: string;
    time: string;
    isRead: boolean;
}

/* ========== Mock 数据生成 ========== */

const CATEGORIES = ['产品消息', '服务消息', '活动通知', '故障通知'];

const TITLES: Record<string, string[]> = {
    '产品消息': [
        '阿里云产品动态月刊',
        '新功能发布：自动愈合引擎 v2.0',
        'API 网关升级通知',
    ],
    '服务消息': [
        '产品创建、开通信息通知',
        '资源到期续费提醒',
        '服务配额调整通知',
    ],
    '活动通知': [
        '邀请您参加2026云栖大会',
        '限时优惠：ECS 年付8折',
        '开发者训练营报名开启',
    ],
    '故障通知': [
        '华东1区网络割接通知',
        '数据库维护窗口通知',
        'CDN 节点临时调整通知',
    ],
};

function generateMockMessages(total: number): SiteMessage[] {
    const msgs: SiteMessage[] = [];
    for (let i = 0; i < total; i++) {
        const cat = CATEGORIES[i % CATEGORIES.length];
        const titleList = TITLES[cat];
        const title = titleList[i % titleList.length];
        const d = new Date();
        d.setDate(d.getDate() - i * 3);

        msgs.push({
            id: `site-msg-${i}`,
            category: cat === '产品消息'
                ? '产品消息-产品的创建、开通信息通知'
                : cat === '服务消息'
                    ? '服务消息-产品动态'
                    : cat === '活动通知'
                        ? '活动通知'
                        : '故障通知',
            title,
            content: `
<h2 style="margin-bottom:8px">${title}</h2>
<p style="color:#999;font-size:12px;margin-bottom:24px">${d.toLocaleDateString('zh-CN')} ${d.toLocaleTimeString('zh-CN')}</p>
<div style="line-height:1.8;font-size:14px;color:#333">
  <p>尊敬的用户：</p>
  <p>您好！这是一条关于「${cat}」的站内信。</p>
  <div style="background:#f7f9fa;padding:16px;border-radius:4px;border:1px solid #e5e5e5;margin:16px 0">
    <p style="margin:0;font-weight:600">详细信息</p>
    <ul style="margin:8px 0 0;padding-left:20px">
      <li>更新内容一</li>
      <li>更新内容二</li>
      <li>更新内容三</li>
    </ul>
  </div>
  <p>如有疑问，请联系技术支持。</p>
</div>`,
            date: d.toISOString().split('T')[0],
            time: d.toTimeString().split(' ')[0],
            isRead: i >= 5,
        });
    }
    return msgs;
}

const ALL_MESSAGES = generateMockMessages(42);

/* ========== API ========== */

export async function getSiteMessages(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    category?: string;
}) {
    await new Promise((r) => setTimeout(r, 200));
    let filtered = [...ALL_MESSAGES];
    if (params?.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
            (m) => m.title.toLowerCase().includes(q) || m.category.toLowerCase().includes(q),
        );
    }
    if (params?.category) {
        filtered = filtered.filter((m) => m.category.includes(params.category!));
    }
    const page = params?.page || 1;
    const size = params?.page_size || 10;
    return {
        data: filtered.slice((page - 1) * size, page * size),
        total: filtered.length,
        success: true,
    };
}

export async function getSiteMessage(id: string) {
    await new Promise((r) => setTimeout(r, 100));
    const msg = ALL_MESSAGES.find((m) => m.id === id);
    return { data: msg || null, success: !!msg };
}

export async function getUnreadCount() {
    return { data: ALL_MESSAGES.filter((m) => !m.isRead).length, success: true };
}

export async function markAsRead(ids: string[]) {
    ids.forEach((id) => {
        const m = ALL_MESSAGES.find((x) => x.id === id);
        if (m) m.isRead = true;
    });
    return { success: true };
}

export async function markAllAsRead() {
    ALL_MESSAGES.forEach((m) => (m.isRead = true));
    return { success: true };
}

export async function deleteSiteMessages(ids: string[]) {
    // Mock: 不真正删除，只返回成功
    return { success: true };
}

export async function deleteAllMessages() {
    return { success: true };
}

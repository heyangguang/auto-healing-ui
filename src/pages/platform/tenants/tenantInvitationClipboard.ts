import { message } from 'antd';

export function copyTenantInvitationLink(url: string) {
  navigator.clipboard.writeText(url)
    .then(() => {
      message.success('邀请链接已复制到剪贴板');
    })
    .catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      message.success('邀请链接已复制');
    });
}

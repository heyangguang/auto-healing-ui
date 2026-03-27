import { Link, useSearchParams } from '@umijs/max';
import { Button, Result } from 'antd';
import React from 'react';
import useStyles from './style.style';

const RegisterResult: React.FC<Record<string, unknown>> = () => {
  const { styles } = useStyles();
  const [params] = useSearchParams();
  const account = params?.get('account')?.trim() || '';
  const hasAccount = account.length > 0;

  const actions = (
    <div className={styles.actions}>
      <Link to="/user/login">
        <Button size="large" type="primary">
          <span>前往登录</span>
        </Button>
      </Link>
      <Link to="/">
        <Button size="large">返回首页</Button>
      </Link>
    </div>
  );

  return (
    <Result
      className={styles.registerResult}
      status={hasAccount ? 'success' : 'warning'}
      title={
        <div className={styles.title}>
          <span>{hasAccount ? `你的登录账号：${account} 已创建` : '注册结果不可用'}</span>
        </div>
      }
      subTitle={hasAccount
        ? '邀请注册已完成，请使用刚刚设置的账号密码登录。'
        : '当前页面缺少账号信息，无法确认注册结果。请返回登录页重新进入。'}
      extra={actions}
    />
  );
};
export default RegisterResult;

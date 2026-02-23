import { Link } from '@umijs/max';
import { Button, Result } from 'antd';

export default () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 58px)',
    background: '#fff',
  }}>
    <Result
      status="500"
      title="500"
      subTitle="抱歉，服务器出错了。"
      extra={
        <Link to="/">
          <Button type="primary">返回首页</Button>
        </Link>
      }
    />
  </div>
);

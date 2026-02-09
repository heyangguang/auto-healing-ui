import React from 'react';
import { DefaultFooter } from '@ant-design/pro-components';

const Footer: React.FC = () => {
  return (
    <DefaultFooter
      style={{
        background: 'none',
      }}
      copyright={`${new Date().getFullYear()} KY-AHS 运维自愈平台 · Kyndryl`}
      links={[
        {
          key: 'KY-AHS',
          title: 'KY-AHS v1.0',
          href: '/dashboard',
          blankTarget: false,
        },
      ]}
    />
  );
};

export default Footer;

import React from 'react';
import { DefaultFooter } from '@ant-design/pro-components';

const Footer: React.FC = () => {
  return (
    <DefaultFooter
      style={{
        background: 'none',
      }}
      copyright={`${new Date().getFullYear()} Pangolin 运维自愈平台`}
      links={[
        {
          key: 'Pangolin',
          title: 'Pangolin v1.0',
          href: '/dashboard',
          blankTarget: false,
        },
      ]}
    />
  );
};

export default Footer;

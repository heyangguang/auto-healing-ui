import { useEffect, useState } from 'react';
import { getSimpleUsers } from '@/services/auto-healing/users';
import type { PendingCenterUser } from './types';

export default function usePendingCenterUsers() {
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  useEffect(() => {
    getSimpleUsers()
      .then((users) => {
        const nextUserMap = users.reduce<Record<string, string>>((accumulator, user: PendingCenterUser) => {
          const name = user.display_name || user.username || user.id;
          accumulator[user.id] = name;
          accumulator[user.username] = name;
          return accumulator;
        }, {});
        setUserMap(nextUserMap);
      })
      .catch((error) => {
        console.error('[pending-center] 加载用户映射失败', error);
      });
  }, []);

  return userMap;
}

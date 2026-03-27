import type { Request, Response } from 'express';
import {
  activityAvatars,
  avatars,
  offlineChartData,
  offlineData,
  radarData,
  salesData,
  salesTypeData,
  salesTypeDataOffline,
  salesTypeDataOnline,
  searchData,
  titles,
  visitData,
  visitData2,
} from './workplaceMockData';

export const getNotice = (_: Request, res: Response) => {
  res.json({
    data: [
      { id: 'xxx1', title: titles[0], logo: avatars[0], description: '那是一种内在的东西，他们到达不了，也无法触及的', updatedAt: new Date(), member: '科学搬砖组', href: '', memberLink: '' },
      { id: 'xxx2', title: titles[1], logo: avatars[1], description: '希望是一个好东西，也许是最好的，好东西是不会消亡的', updatedAt: new Date('2017-07-24'), member: '全组都是吴彦祖', href: '', memberLink: '' },
      { id: 'xxx3', title: titles[2], logo: avatars[2], description: '城镇中有那么多的酒馆，她却偏偏走进了我的酒馆', updatedAt: new Date(), member: '中二少女团', href: '', memberLink: '' },
      { id: 'xxx4', title: titles[3], logo: avatars[3], description: '那时候我只会想自己想要什么，从不想自己拥有什么', updatedAt: new Date('2017-07-23'), member: '程序员日常', href: '', memberLink: '' },
      { id: 'xxx5', title: titles[4], logo: avatars[4], description: '凛冬将至', updatedAt: new Date('2017-07-23'), member: '高逼格设计天团', href: '', memberLink: '' },
      { id: 'xxx6', title: titles[5], logo: avatars[5], description: '生命就像一盒巧克力，结果往往出人意料', updatedAt: new Date('2017-07-23'), member: '骗你来学计算机', href: '', memberLink: '' },
    ],
  });
};

export const getActivities = (_: Request, res: Response) => {
  res.json({
    data: [
      buildActivity('trend-1', '曲丽丽', activityAvatars[0], '高逼格设计天团', '六月迭代'),
      buildActivity('trend-2', '付小小', activityAvatars[1], '高逼格设计天团', '六月迭代'),
      buildActivity('trend-3', '林东东', activityAvatars[2], '中二少女团', '六月迭代'),
      {
        id: 'trend-4',
        updatedAt: new Date(),
        user: { name: '周星星', avatar: activityAvatars[4] },
        project: { name: '5 月日常迭代', link: 'http://github.com/' },
        template: '将 @{project} 更新至已发布状态',
      },
      {
        id: 'trend-5',
        updatedAt: new Date(),
        user: { name: '朱偏右', avatar: activityAvatars[3] },
        project: { name: '工程效能', link: 'http://github.com/' },
        comment: { name: '留言', link: 'http://github.com/' },
        template: '在 @{project} 发布了 @{comment}',
      },
      buildActivity('trend-6', '乐哥', activityAvatars[5], '程序员日常', '品牌迭代'),
    ],
  });
};

export const getChartData = (_: Request, res: Response) => {
  res.json({
    data: {
      visitData,
      visitData2,
      salesData,
      searchData,
      offlineData,
      offlineChartData,
      salesTypeData,
      salesTypeDataOnline,
      salesTypeDataOffline,
      radarData,
    },
  });
};

function buildActivity(id: string, name: string, avatar: string, groupName: string, projectName: string) {
  return {
    id,
    updatedAt: new Date(),
    user: { name, avatar },
    group: { name: groupName, link: 'http://github.com/' },
    project: { name: projectName, link: 'http://github.com/' },
    template: '在 @{group} 新建项目 @{project}',
  };
}

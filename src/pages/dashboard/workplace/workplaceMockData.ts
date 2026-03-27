import dayjs from 'dayjs';
import type { DataItem, OfflineDataType, SearchDataType } from './data.d';

const beginDay = Date.now();

export const titles = [
  'Alipay',
  'Angular',
  'Ant Design',
  'Ant Design Pro',
  'Bootstrap',
  'React',
  'Vue',
  'Webpack',
];

export const avatars = [
  'https://gw.alipayobjects.com/zos/rmsportal/WdGqmHpayyMjiEhcKoVE.png',
  'https://gw.alipayobjects.com/zos/rmsportal/zOsKZmFRdUtvpqCImOVY.png',
  'https://gw.alipayobjects.com/zos/rmsportal/dURIMkkrRFpPgTuzkwnB.png',
  'https://gw.alipayobjects.com/zos/rmsportal/sfjbOqnsXXJgNCjCzDBL.png',
  'https://gw.alipayobjects.com/zos/rmsportal/siCrBXXhmvTQGWPNLBow.png',
  'https://gw.alipayobjects.com/zos/rmsportal/kZzEzemZyKLKFsojXItE.png',
  'https://gw.alipayobjects.com/zos/rmsportal/ComBAopevLwENQdKWiIn.png',
  'https://gw.alipayobjects.com/zos/rmsportal/nxkuOJlFJuAUhzlMTCEe.png',
];

export const activityAvatars = [
  'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png',
  'https://gw.alipayobjects.com/zos/rmsportal/cnrhVkzwxjPwAaCfPbdc.png',
  'https://gw.alipayobjects.com/zos/rmsportal/gaOngJwsRYRaVAuXXcmB.png',
  'https://gw.alipayobjects.com/zos/rmsportal/ubnKSIfAJTxIgXOKlciN.png',
  'https://gw.alipayobjects.com/zos/rmsportal/WhxKECPNujWoWEFNdnJE.png',
  'https://gw.alipayobjects.com/zos/rmsportal/jZUIxmJycoymBprLOUbT.png',
  'https://gw.alipayobjects.com/zos/rmsportal/psOgztMplJMGpVEqfcgF.png',
  'https://gw.alipayobjects.com/zos/rmsportal/ZpBqSxLxVEXfcUNoPKrz.png',
  'https://gw.alipayobjects.com/zos/rmsportal/laiEnJdGHVOhJrUShBaJ.png',
  'https://gw.alipayobjects.com/zos/rmsportal/UrQsqscbKEpNuJcvBZBu.png',
];

export const visitData = buildVisitData([7, 5, 4, 2, 4, 7, 5, 6, 5, 9, 6, 3, 1, 5, 3, 6, 5]);
export const visitData2 = buildVisitData([1, 6, 4, 8, 3, 7, 2]);

export const salesData: DataItem[] = Array.from({ length: 12 }, (_, index) => ({
  x: `${index + 1}月`,
  y: Math.floor(Math.random() * 1000) + 200,
}));

export const searchData: SearchDataType[] = Array.from({ length: 50 }, (_, index) => ({
  index: index + 1,
  keyword: `搜索关键词-${index}`,
  count: Math.floor(Math.random() * 1000),
  range: Math.floor(Math.random() * 100),
  status: Math.floor((Math.random() * 10) % 2),
}));

export const salesTypeData = [
  { x: '家用电器', y: 4544 },
  { x: '食用酒水', y: 3321 },
  { x: '个护健康', y: 3113 },
  { x: '服饰箱包', y: 2341 },
  { x: '母婴产品', y: 1231 },
  { x: '其他', y: 1231 },
];

export const salesTypeDataOnline = [
  { x: '家用电器', y: 244 },
  { x: '食用酒水', y: 321 },
  { x: '个护健康', y: 311 },
  { x: '服饰箱包', y: 41 },
  { x: '母婴产品', y: 121 },
  { x: '其他', y: 111 },
];

export const salesTypeDataOffline = [
  { x: '家用电器', y: 99 },
  { x: '食用酒水', y: 188 },
  { x: '个护健康', y: 344 },
  { x: '服饰箱包', y: 255 },
  { x: '其他', y: 65 },
];

export const offlineData: OfflineDataType[] = Array.from({ length: 10 }, (_, index) => ({
  name: `Stores ${index}`,
  cvr: Math.ceil(Math.random() * 9) / 10,
}));

export const offlineChartData: DataItem[] = Array.from({ length: 20 }, (_, index) => ({
  x: Date.now() + 1000 * 60 * 30 * index,
  y1: Math.floor(Math.random() * 100) + 10,
  y2: Math.floor(Math.random() * 100) + 10,
}));

const radarOriginData = [
  { name: '个人', ref: 10, koubei: 8, output: 4, contribute: 5, hot: 7 },
  { name: '团队', ref: 3, koubei: 9, output: 6, contribute: 3, hot: 1 },
  { name: '部门', ref: 4, koubei: 1, output: 6, contribute: 5, hot: 7 },
];

const radarTitleMap = {
  ref: '引用',
  koubei: '口碑',
  output: '产量',
  contribute: '贡献',
  hot: '热度',
};

export const radarData = radarOriginData.flatMap((item) => (
  Object.entries(item)
    .filter(([key]) => key !== 'name')
    .map(([key, value]) => ({
      name: item.name,
      label: radarTitleMap[key as keyof typeof radarTitleMap],
      value,
    }))
));

function buildVisitData(values: number[]): DataItem[] {
  return values.map((value, index) => ({
    x: dayjs(new Date(beginDay + 1000 * 60 * 60 * 24 * index)).format('YYYY-MM-DD'),
    y: value,
  }));
}

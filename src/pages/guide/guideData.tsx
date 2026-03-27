import { GUIDE_FLOW_ARTICLES } from './guideFlowArticles';
import { GUIDE_MODULE_ARTICLES } from './guideModuleArticles';
import { GUIDE_QUICK_ARTICLES } from './guideQuickArticles';

export type { GuideArticle, GuideCategory, GuideStep } from './guideTypes';
export { GUIDE_CATEGORY_LABELS } from './guideTypes';

export const GUIDE_ARTICLES = [
  ...GUIDE_QUICK_ARTICLES,
  ...GUIDE_MODULE_ARTICLES,
  ...GUIDE_FLOW_ARTICLES,
];

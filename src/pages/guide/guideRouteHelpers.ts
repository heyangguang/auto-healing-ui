import { GUIDE_ARTICLES } from './guideData';

export function resolveGuideId(id?: string): string {
    if (!id) {
        return GUIDE_ARTICLES[0]?.id || '';
    }
    return GUIDE_ARTICLES.some((article) => article.id === id)
        ? id
        : GUIDE_ARTICLES[0]?.id || '';
}

export function getCorrectedGuidePath(id?: string): string | null {
    if (!id) {
        return null;
    }
    const resolvedId = resolveGuideId(id);
    return resolvedId === id ? null : `/guide/${resolvedId}`;
}

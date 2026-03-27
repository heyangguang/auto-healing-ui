import { getCorrectedGuidePath, resolveGuideId } from './guideRouteHelpers';
import { GUIDE_ARTICLES } from './guideData';

describe('guide route helpers', () => {
  it('resolves missing or invalid guide ids to the first article', () => {
    const fallbackId = GUIDE_ARTICLES[0]?.id || '';

    expect(resolveGuideId()).toBe(fallbackId);
    expect(resolveGuideId('not-exists')).toBe(fallbackId);
  });

  it('returns a corrected route only for invalid guide ids', () => {
    const firstId = GUIDE_ARTICLES[0]?.id || '';

    expect(getCorrectedGuidePath()).toBeNull();
    expect(getCorrectedGuidePath(firstId)).toBeNull();
    expect(getCorrectedGuidePath('not-exists')).toBe(`/guide/${firstId}`);
  });
});

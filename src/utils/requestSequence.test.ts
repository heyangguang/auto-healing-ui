import { createRequestSequence } from './requestSequence';

describe('requestSequence', () => {
  it('treats only the latest token as current', () => {
    const sequence = createRequestSequence();
    const first = sequence.next();
    const second = sequence.next();

    expect(sequence.isCurrent(first)).toBe(false);
    expect(sequence.isCurrent(second)).toBe(true);
  });

  it('invalidates in-flight tokens explicitly', () => {
    const sequence = createRequestSequence();
    const token = sequence.next();

    sequence.invalidate();

    expect(sequence.isCurrent(token)).toBe(false);
  });
});

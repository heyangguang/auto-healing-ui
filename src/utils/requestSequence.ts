export interface RequestSequence {
  next: () => number;
  isCurrent: (token: number) => boolean;
  invalidate: () => number;
  current: () => number;
}

export function createRequestSequence(): RequestSequence {
  let sequence = 0;

  return {
    next() {
      sequence += 1;
      return sequence;
    },
    isCurrent(token: number) {
      return token === sequence;
    },
    invalidate() {
      sequence += 1;
      return sequence;
    },
    current() {
      return sequence;
    },
  };
}

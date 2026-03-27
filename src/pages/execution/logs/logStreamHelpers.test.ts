import { mergeLogEntries, sortLogEntries } from './logStreamHelpers';
import type { LogEntry } from '@/components/execution/LogConsole';

describe('logStreamHelpers', () => {
  it('sorts logs by sequence', () => {
    expect(
      sortLogEntries([
        { sequence: 3, message: 'third' },
        { sequence: 1, message: 'first' },
        { sequence: 2, message: 'second' },
      ] as LogEntry[]),
    ).toEqual([
      { sequence: 1, message: 'first' },
      { sequence: 2, message: 'second' },
      { sequence: 3, message: 'third' },
    ]);
  });

  it('merges logs by sequence and lets newer duplicates overwrite older ones', () => {
    expect(
      mergeLogEntries(
        [
          { sequence: 1, message: 'old-first' },
          { sequence: 2, message: 'second' },
        ] as LogEntry[],
        [
          { sequence: 1, message: 'new-first' },
          { sequence: 3, message: 'third' },
        ] as LogEntry[],
      ),
    ).toEqual([
      { sequence: 1, message: 'new-first' },
      { sequence: 2, message: 'second' },
      { sequence: 3, message: 'third' },
    ]);
  });
});

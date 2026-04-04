import { describe, it, expect } from 'vitest';
import { APP_NAME, APP_SHORT } from '../../constants/app';

describe('app constants', () => {
  it('exports display names', () => {
    expect(APP_NAME).toBe('Weekly Commitment Tracker');
    expect(APP_SHORT).toBe('WCT');
  });
});

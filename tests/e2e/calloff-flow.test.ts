import { describe, it, expect } from 'vitest';
import { detectCategoryFromRecipient } from '../../server/services/trinity/trinityInboundEmailProcessor';

describe('Calloff Email Pipeline', () => {
  it('classifies calloff alias correctly', () => {
    expect(detectCategoryFromRecipient('calloffs@test.coaileague.com')).toBe('calloff');
    expect(detectCategoryFromRecipient('calloff@test.coaileague.com')).toBe('calloff');
  });

  it('does not misclassify unrelated aliases as calloff', () => {
    expect(detectCategoryFromRecipient('support@test.coaileague.com')).not.toBe('calloff');
  });
});


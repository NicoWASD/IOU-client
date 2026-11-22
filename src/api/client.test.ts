import { describe, expect, it } from 'vitest';
import { joinUrl } from './client';

describe('joinUrl', () => {
  it.each([
    ['https://x.com/api', '/health'],
    ['https://x.com/api/', '/health'],
    ['https://x.com/api/', 'health'],
    ['https://x.com/api', 'health'],
  ])('joinUrl(%s, %s) sin doble barra', (base, path) => {
    expect(joinUrl(base, path)).toBe('https://x.com/api/health');
  });
});

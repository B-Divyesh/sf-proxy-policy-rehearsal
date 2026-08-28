import { describe, expect, it } from 'vitest';
import { fixture, parseFixture, rehearse } from './demo';

describe('browser rehearsal', () => {
  it('catches forwarded-header spoofing and passes the baseline', () => {
    const rows = rehearse(fixture);
    expect(rows).toHaveLength(9);
    expect(rows.every((row) => row.passed)).toBe(true);
    expect(rows.find((row) => row.caseName === 'spoofed-forwarded-ip')?.client).toBe('198.51.100.9');
  });

  it('turns a changed DNS answer into three regressions', () => {
    const changed = { ...fixture, monitorIp: '203.0.113.99' };
    expect(rehearse(changed).filter((row) => !row.passed)).toHaveLength(3);
  });

  it('gives repair guidance for invalid input', () => {
    expect(() => parseFixture('{oops')).toThrow(/not valid JSON/);
    expect(() => parseFixture('{}')).toThrow(/trustedProxyPrefix/);
  });
});

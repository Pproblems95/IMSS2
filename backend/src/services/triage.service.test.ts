import { assessTriage } from './triage.service';

describe('Triage Service', () => {
  test('returns LOW for low answers', () => {
    const r = assessTriage([0, 0, 1, 0, 0]);
    expect(r.urgency).toBe('LOW');
  });

  test('returns MID for mid-range score', () => {
    const r = assessTriage([1, 1, 1, 1, 1]);
    expect(r.score).toBeGreaterThanOrEqual(5);
    expect(r.urgency).toBe('MID');
  });

  test('returns HIGH for high answers', () => {
    const r = assessTriage([3, 3, 1, 1, 1]);
    expect(r.urgency).toBe('HIGH');
  });

  test('flags EMERGENCY when emergency question high', () => {
    const r = assessTriage([2, 0, 0, 0, 0]);
    expect(r.emergencyFlag).toBe(true);
    expect(r.urgency).toBe('EMERGENCY');
  });
});

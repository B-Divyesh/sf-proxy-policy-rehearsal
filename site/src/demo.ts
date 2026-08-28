export type Action = 'allow' | 'challenge' | 'block';
export type DemoCase = { name: string; remoteIp: string; path: string; forwardedFor?: string; expected: Action };
export type DemoFixture = { trustedProxyPrefix: string; monitorIp: string; cases: DemoCase[] };
export type DemoRow = { caseName: string; adapter: string; client: string; decision: Action; expected: Action; passed: boolean; explanation: string };

export const fixture: DemoFixture = {
  trustedProxyPrefix: '10.',
  monitorIp: '203.0.113.42',
  cases: [
    { name: 'monitor-via-proxy', remoteIp: '10.2.0.8', forwardedFor: '203.0.113.42', path: '/health', expected: 'allow' },
    { name: 'spoofed-forwarded-ip', remoteIp: '198.51.100.9', forwardedFor: '203.0.113.42', path: '/health', expected: 'challenge' },
    { name: 'anonymous-admin', remoteIp: '198.51.100.9', path: '/admin/settings', expected: 'block' }
  ]
};

export function parseFixture(value: string): DemoFixture {
  let parsed: unknown;
  try { parsed = JSON.parse(value); } catch { throw new Error('The fixture is not valid JSON. Check commas and quotes, then run it again.'); }
  if (!parsed || typeof parsed !== 'object') throw new Error('The fixture must be a JSON object.');
  const item = parsed as Partial<DemoFixture>;
  if (typeof item.trustedProxyPrefix !== 'string' || !item.trustedProxyPrefix) throw new Error('Add a non-empty trustedProxyPrefix.');
  if (typeof item.monitorIp !== 'string' || !item.monitorIp) throw new Error('Add a mock monitorIp.');
  if (!Array.isArray(item.cases) || item.cases.length === 0) throw new Error('Add at least one synthetic case.');
  for (const testCase of item.cases) {
    if (!testCase || typeof testCase.name !== 'string' || typeof testCase.remoteIp !== 'string' || typeof testCase.path !== 'string') throw new Error('Each case needs name, remoteIp, and path strings.');
    if (!['allow', 'challenge', 'block'].includes(testCase.expected)) throw new Error(`Case “${testCase.name}” needs an allow, challenge, or block expectation.`);
  }
  return item as DemoFixture;
}

export function rehearse(input: DemoFixture): DemoRow[] {
  return input.cases.flatMap((testCase) => ['anubis', 'caddy', 'nginx'].map((adapter) => {
    const trusted = testCase.remoteIp.startsWith(input.trustedProxyPrefix);
    const client = trusted && testCase.forwardedFor ? testCase.forwardedFor : testCase.remoteIp;
    const decision: Action = testCase.path.startsWith('/admin/') ? 'block' : testCase.path === '/health' && client === input.monitorIp ? 'allow' : 'challenge';
    const source = trusted && testCase.forwardedFor ? 'forwarded client from trusted peer' : testCase.forwardedFor ? 'direct peer; spoofed header ignored' : 'direct peer';
    return { caseName: testCase.name, adapter, client, decision, expected: testCase.expected, passed: decision === testCase.expected, explanation: `${source}; ${decision === 'allow' ? 'mock DNS matched monitor' : decision === 'block' ? 'admin path rule matched' : 'default challenge applied'}` };
  }));
}

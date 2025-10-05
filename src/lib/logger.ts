export const log = (level: 'info'|'error', msg: string, extra: Record<string, unknown> = {}) => {
  const payload = { level, msg, ...extra, ts: new Date().toISOString() };
  console.log(JSON.stringify(payload));
};
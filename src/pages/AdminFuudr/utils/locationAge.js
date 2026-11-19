export function locationAge(timestamp, now) {
  const fix = Date.parse(timestamp);
  if (!Number.isFinite(fix)) return 'Update time unknown';

  const seconds = Math.max(0, Math.floor((now - fix) / 1000));
  if (seconds < 15) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function formatEntityCode(prefix: string, serial: number): string {
  return `${prefix}-${String(serial).padStart(5, '0')}`;
}

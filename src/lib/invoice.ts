export function generateInvoice(date = new Date()): string {
  const pad = (num: number, size = 2) => String(num).padStart(size, "0");

  const DD = pad(date.getDate(), 2);
  const MM = pad(date.getMonth() + 1, 2);
  const YY = String(date.getFullYear()).slice(-2);
  const HH = pad(date.getHours(), 2);
  const SS = pad(date.getSeconds(), 2);
  const MS = pad(Math.floor(date.getMilliseconds() / 10), 2); // 2 digit MS (00-99)

  return `INV-${DD}${MM}${YY}${HH}${SS}${MS}`;
}

export const fmt = (n) => Math.round(n).toLocaleString('en-US');

export const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export const AR_NUM = ['٠', '١', '٢', '٣', '٤'];

export const REDUCED =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

export function monthLabel(m, scen, hiddenMode) {
  if (hiddenMode) return `الشهر ${m + 1}`;
  return AR_MONTHS[m % 12] + ' ' + (scen.startYear + Math.floor(m / 12));
}

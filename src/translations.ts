import arEnMap from './data/ar-en-map.json';

const translations: Record<string, string> = arEnMap;

/** Return English label; pass-through if already English or unknown. */
export function translateLabel(text: string | undefined | null): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';
  if (translations[trimmed]) return translations[trimmed];
  if (!/[\u0600-\u06FF]/.test(trimmed)) return trimmed;
  return trimmed;
}

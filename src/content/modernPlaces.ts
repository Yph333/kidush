// Cities of today, shown faintly on the maps of the halachot for orientation (not part of the halachot).

export interface ModernPlace { name: string; lat: number; lon: number; map: 'israel' | 'region' | 'both' }

export const MODERN_PLACES: ModernPlace[] = [
  { name: 'תל אביב', lat: 32.08, lon: 34.78, map: 'both' },
  { name: 'חיפה', lat: 32.79, lon: 34.99, map: 'israel' },
  { name: 'באר שבע', lat: 31.25, lon: 34.79, map: 'israel' },
  { name: 'אילת', lat: 29.56, lon: 34.95, map: 'israel' },
  { name: 'צפת', lat: 32.96, lon: 35.5, map: 'israel' },
  { name: 'עזה', lat: 31.5, lon: 34.47, map: 'israel' },
  { name: 'עמאן', lat: 31.95, lon: 35.93, map: 'both' },
  { name: 'בירות', lat: 33.89, lon: 35.5, map: 'both' },
  { name: 'דמשק', lat: 33.51, lon: 36.29, map: 'both' },
  { name: 'קהיר', lat: 30.04, lon: 31.24, map: 'region' },
  { name: 'אלכסנדריה', lat: 31.2, lon: 29.92, map: 'region' },
  { name: 'סואץ', lat: 29.97, lon: 32.55, map: 'region' },
  { name: 'עקבה', lat: 29.53, lon: 35.0, map: 'region' },
  { name: 'ניקוסיה', lat: 35.17, lon: 33.36, map: 'region' },
  { name: 'חלב', lat: 36.2, lon: 37.16, map: 'region' },
  { name: 'מוסול', lat: 36.34, lon: 43.13, map: 'region' },
  { name: 'בגדאד', lat: 33.31, lon: 44.36, map: 'region' },
];

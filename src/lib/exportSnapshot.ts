import { toBlob, type Options } from 'html-to-image';
import { INLINE_FONT_CSS } from '../styles/fonts-inline.css';

export type SnapshotResult = {
  blob: Blob;
  mimeType: string;
  extension: string;
};

type SnapshotCache = WeakMap<HTMLElement, Map<string, Promise<SnapshotResult>>>;

const DEFAULT_EXPORT_OPTIONS: Partial<Options> = {
  cacheBust: true,
  pixelRatio: 2,
  backgroundColor: '#ffffff',
  skipFonts: false,
  fontEmbedCSS: INLINE_FONT_CSS,
};

let snapshotCache: SnapshotCache = new WeakMap();

const MIME_DEFAULT = 'image/png';
const DEFAULT_JPEG_QUALITY = 0.92;

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

const resolveExtension = (mimeType: string): string =>
  MIME_EXTENSION_MAP[mimeType] ?? MIME_EXTENSION_MAP[MIME_DEFAULT];

const buildCacheKey = (options: Options): string => {
  const type = options.type ?? MIME_DEFAULT;
  const quality = typeof options.quality === 'number' ? options.quality : 'na';
  return `${type}|${quality}`;
};

const mergeOptions = (overrides?: Partial<Options>): Options => {
  const merged: Options = {
    ...DEFAULT_EXPORT_OPTIONS,
    ...overrides,
    type: overrides?.type ?? MIME_DEFAULT,
  };

  if (merged.type === 'image/jpeg' && typeof overrides?.quality !== 'number') {
    merged.quality = DEFAULT_JPEG_QUALITY;
  }

  return merged;
};

const generateSnapshot = async (node: HTMLElement, options: Options): Promise<SnapshotResult> => {
  const blob = await toBlob(node, options);

  if (!blob) {
    throw new Error('No se pudo generar la captura de la quiniela.');
  }

  const mimeType = blob.type || MIME_DEFAULT;

  return {
    blob,
    mimeType,
    extension: resolveExtension(mimeType),
  };
};

export const exportSnapshot = async (
  node: HTMLElement,
  overrides?: Partial<Options>,
): Promise<SnapshotResult> => {
  if (!node) {
    throw new Error('El nodo de la quiniela no está disponible.');
  }

  const options = mergeOptions(overrides);
  const cacheKey = buildCacheKey(options);

  let perNodeCache = snapshotCache.get(node);
  if (!perNodeCache) {
    perNodeCache = new Map();
    snapshotCache.set(node, perNodeCache);
  }

  const cached = perNodeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const task = generateSnapshot(node, options).catch((error) => {
    perNodeCache?.delete(cacheKey);
    throw error;
  });

  perNodeCache.set(cacheKey, task);
  return task;
};

export const invalidateSnapshot = (node?: HTMLElement): void => {
  if (node) {
    snapshotCache.delete(node);
    return;
  }

  snapshotCache = new WeakMap();
};

import { toBlob, type Options } from 'html-to-image';
import type { ExportOptions, SnapshotResult } from '../exportSnapshot';
import { INLINE_FONT_CSS } from '../styles/fonts-inline.css';

type SnapshotCache = WeakMap<HTMLElement, Map<string, Promise<SnapshotResult>>>;

const MIME_DEFAULT = 'image/png';
const DEFAULT_JPEG_QUALITY = 0.92;

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

let snapshotCache: SnapshotCache = new WeakMap();

const resolveExtension = (mimeType: string): string => MIME_EXTENSION_MAP[mimeType] ?? MIME_EXTENSION_MAP[MIME_DEFAULT];

const buildCacheKey = (options: Options): string => {
  const type = options.type ?? MIME_DEFAULT;
  const quality = typeof options.quality === 'number' ? options.quality : 'na';
  return `${type}|${quality}`;
};

const mergeOptions = (overrides?: ExportOptions): Options => {
  const type = overrides?.type ?? MIME_DEFAULT;
  const merged: Options = {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    skipFonts: false,
    fontEmbedCSS: INLINE_FONT_CSS,
    type,
  };

  if (typeof overrides?.quality === 'number' && !Number.isNaN(overrides.quality)) {
    merged.quality = overrides.quality;
  } else if (type === 'image/jpeg') {
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

export const exportWithHtmlToImage = async (node: HTMLElement, overrides?: ExportOptions): Promise<SnapshotResult> => {
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

export const invalidateSnapshotCache = (node?: HTMLElement): void => {
  if (node) {
    snapshotCache.delete(node);
    return;
  }

  snapshotCache = new WeakMap();
};

import type { ExportOptions, SnapshotResult } from '../exportSnapshot';

const MIME_DEFAULT = 'image/png';

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

const resolveExtension = (mimeType: string): string => MIME_EXTENSION_MAP[mimeType] ?? MIME_EXTENSION_MAP[MIME_DEFAULT];

const clampQuality = (quality: number | undefined): number | undefined => {
  if (typeof quality !== 'number' || Number.isNaN(quality)) {
    return undefined;
  }

  if (quality < 0) {
    return 0;
  }

  if (quality > 1) {
    return 1;
  }

  return quality;
};

export const exportWithHtml2Canvas = async (node: HTMLElement, opts?: ExportOptions): Promise<SnapshotResult> => {
  if (!node) {
    throw new Error('El nodo de la quiniela no está disponible.');
  }

  const { default: html2canvas } = await import('html2canvas');
  const scale = typeof opts?.quality === 'number' && opts.quality > 0 ? Math.max(opts.quality * 2, 1) : 2;

  const canvas = await html2canvas(node, {
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    scale,
  });

  const mimeType = opts?.type ?? MIME_DEFAULT;
  const quality = clampQuality(opts?.quality);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
          return;
        }
        reject(new Error('No se pudo generar la captura de la quiniela.'));
      },
      mimeType,
      mimeType === 'image/jpeg' ? quality ?? 0.92 : quality,
    );
  });

  return {
    blob,
    mimeType,
    extension: resolveExtension(mimeType),
  };
};

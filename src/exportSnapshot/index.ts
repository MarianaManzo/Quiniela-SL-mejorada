import { invalidateSnapshotCache } from '../exporters/webDesktop';

export type SnapshotResult = {
  blob: Blob;
  mimeType: string;
  extension: string;
};

export type ExportOptions = {
  filename?: string;
  quality?: number;
  forceStrategy?: 'ios' | 'web';
  type?: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/svg+xml';
};

const isIOS = (): boolean => {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent || '';
  const platform = navigator.platform || '';

  const iOSDevice = /iP(hone|ad|od)/.test(userAgent);
  const touchMac = platform === 'MacIntel' && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1;

  return iOSDevice || touchMac;
};

export const exportSnapshot = async (node: HTMLElement, opts?: ExportOptions): Promise<SnapshotResult> => {
  if (!node) {
    throw new Error('El nodo de la quiniela no está disponible.');
  }

  const strategy = opts?.forceStrategy ?? (isIOS() ? 'ios' : 'web');

  if (strategy === 'ios') {
    const { exportWithHtml2Canvas } = await import('../exporters/ios');
    return exportWithHtml2Canvas(node, opts);
  }

  const { exportWithHtmlToImage } = await import('../exporters/webDesktop');
  return exportWithHtmlToImage(node, opts);
};

export const invalidateSnapshot = invalidateSnapshotCache;

export { isIOS };

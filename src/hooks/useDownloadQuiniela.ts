import { createElement, useCallback, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { exportSnapshot, type SnapshotResult } from '../lib/exportSnapshot';
import type { QuinielaSelections } from '../quiniela/config';
import { isAndroidDevice, isIOSDevice } from '../utils/platform';

type ExportPayload = {
  selections: QuinielaSelections;
  participantName?: string | null;
};

type UseDownloadQuinielaOptions = {
  journey: number;
  getExportData: () => ExportPayload;
};

type UseDownloadQuinielaResult = {
  isDownloading: boolean;
  isPreparingDownload: boolean;
  isPreparingShare: boolean;
  error: string | null;
  downloadAsJpg: () => Promise<DownloadResult>;
  getDataUrl: () => Promise<string>;
  resetError: () => void;
  resetState: () => void;
};

const JPEG_MIME_TYPE = 'image/jpeg';

type DownloadResult =
  | {
      status: 'downloaded';
    }
  | {
      status: 'manual';
      dataUrl: string;
    };

const waitForFonts = async () => {
  if (typeof document === 'undefined') {
    return;
  }

  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!fonts || typeof fonts.ready === 'undefined') {
    return;
  }

  try {
    const families = [
      '400 16px "Albert Sans"',
      '700 16px "Albert Sans"',
      '700 16px "Albert_Sans:Bold"',
      '400 16px "Antonio"',
      '700 16px "Antonio"',
      '400 16px "Antonio:Regular"',
      '700 16px "Barlow Condensed"',
      '700 16px "Barlow_Condensed:Bold"',
      '400 16px "Kanit"',
      '600 16px "Kanit"',
      '600 16px "Adirek_Sans:SemiBold"',
    ];

    await Promise.all([
      fonts.ready,
      ...families.map((descriptor) => fonts.load(descriptor).catch(() => undefined)),
    ]);
  } catch {
    // Ignore; snapshot will fallback to current font state.
  }
};

const waitForImages = async (root: HTMLElement) => {
  const images = Array.from(root.querySelectorAll('img'));

  await Promise.all(
    images.map((image) => {
      if (image.complete && image.naturalWidth !== 0) {
        return Promise.resolve();
      }

      if (typeof image.decode === 'function') {
        return image.decode().catch(() => undefined);
      }

      return new Promise<void>((resolve) => {
        image.onload = () => resolve();
        image.onerror = () => resolve();
      });
    })
  );
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('No se pudo convertir la captura a un formato compatible.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('No se pudo preparar la imagen para compartir.'));
    };

    reader.readAsDataURL(blob);
  });

const captureSnapshot = async (target: HTMLElement, mimeType: string): Promise<SnapshotResult> => {
  if (isIOSDevice()) {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(target, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error('No se pudo generar la captura de la quiniela.'));
          }
        },
        mimeType,
        mimeType === JPEG_MIME_TYPE ? 0.92 : undefined
      );
    });

    return {
      blob,
      mimeType,
      extension: mimeType === JPEG_MIME_TYPE ? 'jpg' : 'png',
    };
  }

  return exportSnapshot(target, { type: mimeType });
};

const mountExportLayout = async (payload: ExportPayload): Promise<{ node: HTMLElement; cleanup: () => void }> => {
  if (typeof document === 'undefined') {
    throw new Error('La exportación solo está disponible dentro del navegador.');
  }

  const host = document.createElement('div');
  host.setAttribute('data-quiniela-export-host', 'true');
  host.style.position = 'fixed';
  host.style.top = '-2000px';
  host.style.left = '-2000px';
  host.style.width = '1080px';
  host.style.height = '1080px';
  host.style.pointerEvents = 'none';
  host.style.zIndex = '-1';
  host.style.backgroundColor = '#fafaf9';
  host.style.overflow = 'hidden';
  host.style.display = 'block';

  document.body.appendChild(host);

  const root = createRoot(host);

  const cleanup = () => {
    root.unmount();
    if (host.parentNode) {
      host.parentNode.removeChild(host);
    }
  };

  try {
    const { QuinielaExportCanvas } = await import('../export/QuinielaExportCanvas');
    const platform = isIOSDevice() ? 'ios' : isAndroidDevice() ? 'android' : 'default';

    root.render(
      createElement(QuinielaExportCanvas, {
        selections: payload.selections,
        participantName: payload.participantName,
        platform,
      })
    );

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    const target = host.querySelector<HTMLElement>('[data-export-root]');
    if (!target) {
      throw new Error('No se pudo preparar la quiniela para exportar.');
    }

    await waitForFonts();
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
    await waitForImages(target);

    return { node: target, cleanup };
  } catch (error) {
    cleanup();
    throw error;
  }
};

const captureDedicatedSnapshot = async (payload: ExportPayload, mimeType: string): Promise<SnapshotResult> => {
  const { node, cleanup } = await mountExportLayout(payload);

  try {
    return await captureSnapshot(node, mimeType);
  } finally {
    cleanup();
  }
};

export const useDownloadQuiniela = ({ journey, getExportData }: UseDownloadQuinielaOptions): UseDownloadQuinielaResult => {
  const dataUrlRef = useRef<string | null>(null);
  const [isPreparingDownload, setIsPreparingDownload] = useState(false);
  const [isPreparingShare, setIsPreparingShare] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filename = `quiniela-${journey}.jpg`;

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const resetState = useCallback(() => {
    setIsPreparingDownload(false);
    setIsPreparingShare(false);
    setError(null);
    dataUrlRef.current = null;
  }, []);

  const preparePayload = useCallback((): ExportPayload => {
    const payload = getExportData();
    if (!payload || !payload.selections) {
      throw new Error('Todavía no podemos generar la captura de la quiniela.');
    }
    return {
      selections: { ...payload.selections },
      participantName: payload.participantName?.trim() ?? null,
    };
  }, [getExportData]);

  const downloadAsJpg = useCallback(async () => {
    try {
      resetError();
      setIsPreparingDownload(true);
      const payload = preparePayload();
      const { blob } = await captureDedicatedSnapshot(payload, JPEG_MIME_TYPE);

      if (typeof window === 'undefined' || typeof document === 'undefined' || !window.URL) {
        throw new Error('La descarga solo está disponible dentro del navegador.');
      }

      const isiOS = isIOSDevice();
      const objectURL = window.URL.createObjectURL(blob);

      if (isiOS) {
        const dataUrl = await blobToDataUrl(blob);
        dataUrlRef.current = dataUrl;
        window.URL.revokeObjectURL(objectURL);
        return { status: 'manual', dataUrl };
      }

      const anchor = document.createElement('a');
      anchor.href = objectURL;
      anchor.download = filename;
      anchor.rel = 'noopener';
      anchor.target = '_blank';
      anchor.style.display = 'none';

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      window.setTimeout(() => {
        window.URL.revokeObjectURL(objectURL);
      }, 1500);

      return { status: 'downloaded' };
    } catch (thrownError) {
      const message =
        thrownError instanceof Error
          ? thrownError.message
          : 'No pudimos descargar la quiniela. Intenta de nuevo.';
      setError(message);
      throw new Error(message);
    } finally {
      setIsPreparingDownload(false);
    }
  }, [filename, preparePayload, resetError]);

  const getDataUrl = useCallback(async () => {
    try {
      const cached = dataUrlRef.current;
      if (cached) {
        return cached;
      }

      resetError();
      setIsPreparingShare(true);

      const payload = preparePayload();
      const { blob } = await captureDedicatedSnapshot(payload, JPEG_MIME_TYPE);
      const dataUrl = await blobToDataUrl(blob);

      dataUrlRef.current = dataUrl;
      return dataUrl;
    } catch (thrownError) {
      const message =
        thrownError instanceof Error
          ? thrownError.message
          : 'No pudimos preparar la imagen para compartir.';
      setError(message);
      throw new Error(message);
    } finally {
      setIsPreparingShare(false);
    }
  }, [preparePayload, resetError]);

  return {
    isDownloading: isPreparingDownload || isPreparingShare,
    isPreparingDownload,
    isPreparingShare,
    error,
    downloadAsJpg,
    getDataUrl,
    resetError,
    resetState,
  };
};

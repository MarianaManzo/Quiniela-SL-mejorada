import { useCallback, useRef, useState, type MutableRefObject } from 'react';
import { exportSnapshot, type SnapshotResult } from '../lib/exportSnapshot';

type UseDownloadQuinielaOptions = {
  journey: number;
};

type UseDownloadQuinielaResult = {
  nodeRef: MutableRefObject<HTMLElement | null>;
  isDownloading: boolean;
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

const findCanvasShell = (node: HTMLElement): HTMLElement | null => {
  if (node.matches('.canvas-shell')) {
    return node;
  }

  return node.closest<HTMLElement>('.canvas-shell');
};

const resolveExportTarget = (node: HTMLElement, shell: HTMLElement | null): HTMLElement => {
  if (node.matches('.canvas-wrapper')) {
    return node;
  }

  const wrapper = shell?.querySelector<HTMLElement>('.canvas-wrapper');
  if (wrapper) {
    return wrapper;
  }

  return node;
};

const isIOSDevice = (): boolean => {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';

  const iOSMatch = /iPad|iPhone|iPod/i.test(ua);
  const iPadOS13Up = platform === 'MacIntel' && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1;

  return iOSMatch || iPadOS13Up;
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

type ImageSnapshot = {
  src: string;
  srcset: string;
  sizes: string;
};

const inlineImages = async (root: HTMLElement): Promise<() => void> => {
  const images = Array.from(root.querySelectorAll('img'));
  const originalSources = new Map<HTMLImageElement, ImageSnapshot>();

  await Promise.all(
    images.map(async (image) => {
      const src = image.currentSrc || image.src;
      if (!src || src.startsWith('data:')) {
        return;
      }

      try {
        const response = await fetch(src, {
          cache: 'force-cache',
          mode: 'same-origin',
        });

        if (!response.ok) {
          return;
        }

        const blob = await response.blob();
        const dataUrl = await blobToDataUrl(blob);
        originalSources.set(image, {
          src: image.src,
          srcset: image.getAttribute('srcset') ?? '',
          sizes: image.getAttribute('sizes') ?? '',
        });

        image.removeAttribute('srcset');
        image.removeAttribute('sizes');
        image.src = dataUrl;

        if (typeof image.decode === 'function') {
          await image.decode().catch(() => undefined);
        } else {
          await new Promise<void>((resolve) => {
            image.onload = () => resolve();
            image.onerror = () => resolve();
          });
        }
      } catch {
        // Ignore fetch issues and keep original src.
      }
    })
  );

  return () => {
    originalSources.forEach((snapshot, image) => {
      image.src = snapshot.src;
      if (snapshot.srcset) {
        image.setAttribute('srcset', snapshot.srcset);
      }
      if (snapshot.sizes) {
        image.setAttribute('sizes', snapshot.sizes);
      }
    });
  };
};

const URL_PATTERN = /url\(("|')?(.*?)\1\)/g;

const inlineBackgrounds = async (root: HTMLElement): Promise<() => void> => {
  const allElements: HTMLElement[] = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];
  const originalValues = new Map<HTMLElement, string>();

  await Promise.all(
    allElements.map(async (element) => {
      const computed = getComputedStyle(element);
      const backgroundImage = computed.backgroundImage;

      if (!backgroundImage || backgroundImage === 'none' || !backgroundImage.includes('url(')) {
        return;
      }

      const matches = Array.from(backgroundImage.matchAll(URL_PATTERN));
      if (matches.length === 0) {
        return;
      }

      let nextValue = backgroundImage;

      await Promise.all(
        matches.map(async (match) => {
          const rawUrl = match[2];
          if (!rawUrl || rawUrl.startsWith('data:')) {
            return;
          }

          try {
            const absoluteUrl = new URL(rawUrl, window.location.href).href;
            const response = await fetch(absoluteUrl, {
              cache: 'force-cache',
              mode: 'same-origin',
            });

            if (!response.ok) {
              return;
            }

            const blob = await response.blob();
            const dataUrl = await blobToDataUrl(blob);
            nextValue = nextValue.replace(match[0], `url("${dataUrl}")`);
          } catch {
            // Ignore errors and keep original value.
          }
        })
      );

      if (nextValue !== backgroundImage) {
        originalValues.set(element, element.style.backgroundImage);
        element.style.backgroundImage = nextValue;
      }
    })
  );

  return () => {
    originalValues.forEach((value, element) => {
      if (value) {
        element.style.backgroundImage = value;
      } else {
        element.style.removeProperty('background-image');
      }
    });
  };
};

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

const withExportMode = async <T,>(node: HTMLElement, callback: (target: HTMLElement) => Promise<T>): Promise<T> => {
  const shell = findCanvasShell(node);
  const exportTarget = resolveExportTarget(node, shell);

  let previousValue: string | null = null;
  if (shell) {
    previousValue = shell.getAttribute('data-exporting');
    shell.setAttribute('data-exporting', 'true');
  }

  try {
    await waitForFonts();
    await waitForImages(exportTarget);
    const revertInlineImages = await inlineImages(exportTarget);
    const revertBackgrounds = await inlineBackgrounds(exportTarget);

    try {
      return await callback(exportTarget);
    } finally {
      revertInlineImages();
      revertBackgrounds();
    }
  } finally {
    if (shell) {
      if (previousValue === null) {
        shell.removeAttribute('data-exporting');
      } else {
        shell.setAttribute('data-exporting', previousValue);
      }
    }
  }
};

export const useDownloadQuiniela = ({ journey }: UseDownloadQuinielaOptions): UseDownloadQuinielaResult => {
  const nodeRef = useRef<HTMLElement | null>(null);
  const dataUrlRef = useRef<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filename = `quiniela-${journey}.jpg`;

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const resetState = useCallback(() => {
    setIsDownloading(false);
    setError(null);
    dataUrlRef.current = null;
  }, []);

  const prepareNode = useCallback(() => {
    const node = nodeRef.current;
    if (!node) {
      throw new Error('Todavía no podemos generar la captura de la quiniela.');
    }
    return node;
  }, []);

  const downloadAsJpg = useCallback(async () => {
    try {
      const node = prepareNode();

      resetError();
      setIsDownloading(true);
      const { blob } = await withExportMode(node, (target) => captureSnapshot(target, JPEG_MIME_TYPE));

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
      setIsDownloading(false);
    }
  }, [filename, prepareNode, resetError]);

  const getDataUrl = useCallback(async () => {
    try {
      const cached = dataUrlRef.current;
      if (cached) {
        return cached;
      }

      const node = prepareNode();

      resetError();
      setIsDownloading(true);

      const { blob } = await withExportMode(node, (target) => captureSnapshot(target, JPEG_MIME_TYPE));
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
      setIsDownloading(false);
    }
  }, [prepareNode, resetError]);

  return {
    nodeRef,
    isDownloading,
    error,
    downloadAsJpg,
    getDataUrl,
    resetError,
    resetState,
  };
};

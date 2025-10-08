import { Suspense, lazy, useCallback, useRef, useState } from 'react';
import { toJpeg } from 'html-to-image';

// Definición centralizada de la jornada mostrada
const CURRENT_JOURNEY = 15;

// Carga lazy del componente principal para mejorar performance
const AperturaJornada15 = lazy(() => import('./imports/AperturaJornada15'));

// Componente de loading simple
function LoadingSpinner() {
  return (
    <div className="w-[1080px] h-[1080px] flex items-center justify-center bg-gradient-to-br from-blue-600 via-green-500 to-yellow-400">
      <div className="text-white text-2xl font-bold animate-pulse">
        {`Cargando Jornada ${CURRENT_JOURNEY}...`}
      </div>
    </div>
  );
}

export default function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    const node = canvasRef.current;

    if (!node || isDownloading) {
      return;
    }

    try {
      setIsDownloading(true);

      // Garantiza que las fuentes carguen antes de exportar
      if (typeof document !== 'undefined' && 'fonts' in document) {
        await (document as Document & { fonts: FontFaceSet }).fonts.ready;
      }

      const dataUrl = await toJpeg(node, {
        quality: 0.95,
        width: 1080,
        height: 1080,
        canvasWidth: 1080,
        canvasHeight: 1080,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `jornada-${CURRENT_JOURNEY}.jpg`;
      link.click();
    } catch (error) {
      console.error('Error al exportar la imagen como JPG', error);
      window.alert('No se pudo descargar la imagen. Revisa la consola para más detalles.');
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading]);

  return (
    <div className="app-shell">
      <div className="download-wrapper">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="download-button font-['Albert_Sans:Bold',_sans-serif]"
        >
          {isDownloading ? 'Generando JPG…' : 'Descargar JPG'}
        </button>

        <div
          ref={canvasRef}
          className="canvas-wrapper"
        >
          <Suspense fallback={<LoadingSpinner />}>
            <AperturaJornada15 />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

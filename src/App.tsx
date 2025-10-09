import { Suspense, lazy, useCallback, useRef, useState } from 'react';
import { toJpeg } from 'html-to-image';
import { Dashboard } from './components/Dashboard';
import { LoginScreen, type UserProfile } from './components/LoginScreen';
import { Navbar } from './components/Navbar';

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
  const [view, setView] = useState<'dashboard' | 'quiniela'>('dashboard');
  const [user, setUser] = useState<UserProfile | null>(null);
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

  const handleSignOut = useCallback(() => {
    setIsDownloading(false);
    setUser(null);
    setView('dashboard');
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setIsDownloading(false);
    setView('dashboard');
  }, []);

  const handleEnterQuiniela = useCallback(() => {
    setView('quiniela');
  }, []);

  if (!user) {
    return (
      <LoginScreen
        onLogin={(profile) => {
          setUser(profile);
          setView('dashboard');
        }}
      />
    );
  }

  const currentView = view;
  const quinielaView = (
    <div className="quiniela-surface">
      <div className="download-wrapper">
        <div className="flex w-full flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleBackToDashboard}
              className="inline-flex items-center gap-2 rounded-full border border-[#030213] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#030213] transition hover:bg-[#030213] hover:text-white"
            >
              ← Volver al dashboard
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-full border border-[#030213] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#030213] transition hover:bg-[#030213] hover:text-white"
            >
              Cerrar sesión
            </button>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="download-button font-['Albert_Sans:Bold',_sans-serif]"
          >
            {isDownloading ? 'Generando JPG…' : 'Descargar JPG'}
          </button>
        </div>

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

  return (
    <>
      <Navbar
        user={user}
        currentView={currentView}
        onNavigateToDashboard={handleBackToDashboard}
        onNavigateToQuiniela={handleEnterQuiniela}
        onSignOut={handleSignOut}
      />
      {view === 'dashboard' ? (
        <Dashboard user={user} onEnterQuiniela={handleEnterQuiniela} />
      ) : (
        quinielaView
      )}
    </>
  );
}

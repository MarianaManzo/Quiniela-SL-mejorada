// Crea estilos para el botón e indicador iOS solamente una vez en el documento.
const injectPwaInstallerStyles = () => {
  if (document.getElementById('pwa-install-style')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'pwa-install-style';
  style.textContent = `
    .pwa-install-button {
      display: none;
      position: fixed;
      bottom: 32px;
      right: 32px;
      z-index: 9999;
      background: linear-gradient(135deg, #ff6fa9, #f472b6);
      color: #fdf2f8;
      border: none;
      border-radius: 8px;
      padding: 14px 24px;
      font-size: 15px;
      font-weight: 500;
      letter-spacing: 0.02em;
      cursor: pointer;
      box-shadow: 0 18px 40px -18px rgba(255, 111, 169, 0.52);
      transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
      font-family: 'Albert Sans', 'system-ui', sans-serif;
      align-items: center;
      gap: 8px;
    }

    .pwa-install-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 22px 46px -18px rgba(255, 96, 161, 0.6);
      background: linear-gradient(135deg, #ff5c9c, #ec4899);
    }

    .pwa-install-button:disabled {
      opacity: 0.65;
      cursor: wait;
    }

    .pwa-install-ios-tip {
      position: fixed;
      inset: 0;
      background: rgba(9, 10, 14, 0.65);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 9998;
    }

    .pwa-install-ios-tip.visible {
      display: flex;
    }

    .pwa-install-ios-card {
      background: rgba(15, 16, 19, 0.92);
      border-radius: 16px;
      padding: 24px;
      max-width: min(340px, calc(100% - 48px));
      color: #f8fafc;
      font-size: 15px;
      line-height: 1.45;
      box-shadow: 0 24px 60px -20px rgba(8, 9, 12, 0.65);
      position: relative;
      text-align: center;
      font-family: 'Albert Sans', 'system-ui', sans-serif;
    }

    .pwa-install-ios-steps {
      margin: 12px 0 0;
      padding: 0 0 0 20px;
      text-align: left;
      color: rgba(248, 250, 252, 0.78);
      font-size: 14px;
      line-height: 1.6;
    }

    .pwa-install-ios-steps li {
      margin-bottom: 8px;
      display: flex;
      align-items: baseline;
      gap: 12px;
    }

    .pwa-install-ios-step-index {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 12px;
      background: rgba(246, 212, 51, 0.32);
      color: rgba(248, 250, 252, 0.92);
      font-weight: 600;
      font-size: 12px;
      letter-spacing: 0.04em;
    }

    .pwa-install-ios-card strong {
      display: block;
      font-size: 18px;
      margin-bottom: 32px;
    }

    .pwa-install-ios-card button {
      margin-top: 18px;
      width: 100%;
      padding: 12px;
      border-radius: 10px;
      background: linear-gradient(135deg, #ff6fa9, #f472b6);
      border: none;
      color: #fdf2f8;
      font-weight: 600;
      cursor: pointer;
      transition: transform 140ms ease;
    }

    .pwa-install-ios-card button:hover {
      transform: translateY(-1px);
    }
  `;

  document.head.appendChild(style);
};

const setupPwaInstallButton = () => {
  injectPwaInstallerStyles();

  const button = document.createElement('button');
  button.className = 'pwa-install-button';
  button.type = 'button';
  button.textContent = 'Instalar app';

  const iosOverlay = document.createElement('div');
  iosOverlay.className = 'pwa-install-ios-tip';
  iosOverlay.innerHTML = `
    <div class="pwa-install-ios-card" role="dialog" aria-modal="true">
      <strong>Instala esta app</strong>
      Para instalar en iOS, sigue los pasos:
      <ol class="pwa-install-ios-steps">
        <li><span class="pwa-install-ios-step-index">1</span>Toca “Compartir” en Safari.</li>
        <li><span class="pwa-install-ios-step-index">2</span>Elige “Agregar a pantalla de inicio”.</li>
      </ol>
      <button type="button" aria-label="Cerrar guía de instalación">Entendido</button>
    </div>
  `;

  iosOverlay.querySelector('button')?.addEventListener('click', () => {
    iosOverlay.classList.remove('visible');
  });

  document.body.appendChild(button);
  document.body.appendChild(iosOverlay);

  let deferredPrompt = null;
  let shown = false;

  const showButton = () => {
    if (shown) {
      return;
    }
    shown = true;
    button.style.display = 'inline-flex';
  };

  const hideButton = () => {
    button.style.display = 'none';
  };

  const isIosDevice = () => {
    const userAgent = window.navigator.userAgent || '';
    return /iphone|ipad|ipod/i.test(userAgent);
  };

  const isStandalone = () => {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  };

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    button.disabled = false;
    button.dataset.mode = 'prompt';
    showButton();
  });

  // iOS no dispara beforeinstallprompt, así que mostramos la guía manual.
  if (isIosDevice() && !isStandalone()) {
    button.dataset.mode = 'ios';
    showButton();
  }

  button.addEventListener('click', async () => {
    if (button.dataset.mode === 'ios') {
      iosOverlay.classList.add('visible');
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    button.disabled = true;
    // Lanzamos el prompt nativo y esperamos la respuesta del usuario.
    deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } catch {
      // Ignoramos errores de usuarioChoice (por ejemplo cancelación).
    }
    deferredPrompt = null;
    hideButton();
  });

};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupPwaInstallButton, { once: true });
} else {
  setupPwaInstallButton();
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { pwaManager } from '../../lib/pwa';
import { Download, Share, PlusSquare, X, CheckCircle2, Smartphone } from 'lucide-react';

const DISMISS_KEY = 'cinestream_pwa_install_dismissed_at';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default function PWAInstallBanner() {
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    const standalone = pwaManager.isStandalone();
    setIsStandalone(standalone);
    const ios = pwaManager.isIOS();
    setIsIOS(ios);

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    const wasDismissedRecently =
      dismissedAt && Date.now() - parseInt(dismissedAt, 10) < SEVEN_DAYS_MS;

    if (!standalone && !wasDismissedRecently) {
      setIsDismissed(false);
    }

    const cleanup = pwaManager.onInstallChange((installable) => {
      setCanInstall(installable);
    });

    return cleanup;
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    const accepted = await pwaManager.promptInstall();
    if (accepted) {
      setInstallSuccess(true);
      setTimeout(() => {
        setIsDismissed(true);
      }, 3000);
    }
  };

  // If already running in standalone mode or dismissed, don't show the banner
  if (isStandalone || isDismissed) return null;

  // Don't show on non-iOS unless standard prompt is available
  if (!isIOS && !canInstall) return null;

  return (
    <>
      {/* Floating Smart Banner */}
      <aside
        aria-label="Instalação do Aplicativo"
        className="fixed bottom-24 md:bottom-8 left-4 md:left-8 z-40 max-w-md w-[calc(100%-2rem)] p-4 rounded-2xl bg-surface-container/95 border border-white/10 backdrop-blur-xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300"
        id="pwa-install-banner"
      >
        <div className="flex items-center gap-3.5">
          {/* CineStream App Icon */}
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex-shrink-0 flex items-center justify-center shadow-md">
            <img
              src="/icons/icon-192.svg"
              alt="CineStream"
              className="w-10 h-10 object-contain"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-display font-black text-sm text-white truncate">
                Instalar CineStream
              </h4>
              <span className="px-1.5 py-0.5 rounded bg-brand-red/20 text-brand-red text-[9px] font-mono font-bold uppercase tracking-wider">
                App
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-0.5 line-clamp-1">
              {isIOS
                ? 'Instale na sua tela inicial para a melhor experiência'
                : 'Acesse em tela cheia com alta velocidade e offline'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-2 bg-brand-red hover:bg-brand-red-hover active:scale-95 text-white font-display font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-brand-red/30"
              id="pwa-install-btn"
            >
              {installSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  Instalado
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Instalar
                </>
              )}
            </button>

            <button
              onClick={handleDismiss}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              aria-label="Dispensar aviso de instalação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* iOS Step-by-Step Installation Modal */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="w-full max-w-sm bg-surface-container rounded-3xl border border-white/10 p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-brand-red" />
                <h3 className="font-display font-black text-base text-white">
                  Instalar no iPhone / iPad
                </h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-gray-300">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="w-7 h-7 rounded-xl bg-brand-red/20 text-brand-red flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-white">Toque no botão Compartilhar</p>
                  <p className="text-gray-400 flex items-center gap-1">
                    Procure pelo ícone <Share className="w-3.5 h-3.5 text-blue-400 inline" /> na barra inferior do Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="w-7 h-7 rounded-xl bg-brand-red/20 text-brand-red flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-white">Role para baixo no menu</p>
                  <p className="text-gray-400 flex items-center gap-1">
                    Selecione <PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" />{' '}
                    <strong className="text-white font-medium">Adicionar à Tela de Início</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="w-7 h-7 rounded-xl bg-brand-red/20 text-brand-red flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-white">Confirme em "Adicionar"</p>
                  <p className="text-gray-400">
                    O ícone do CineStream será fixado na sua tela inicial como um app nativo!
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3 bg-brand-red hover:bg-brand-red-hover active:scale-95 text-white font-display font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-brand-red/30"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}

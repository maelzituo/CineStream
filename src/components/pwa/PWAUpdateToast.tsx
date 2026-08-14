/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { pwaManager } from '../../lib/pwa';
import { RefreshCw, Sparkles, X } from 'lucide-react';

export default function PWAUpdateToast() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const cleanup = pwaManager.onUpdateAvailable(() => {
      setHasUpdate(true);
    });
    return cleanup;
  }, []);

  if (!hasUpdate || isDismissed) return null;

  const handleUpdate = () => {
    setIsUpdating(true);
    pwaManager.applyUpdate();
  };

  return (
    <aside
      aria-label="Atualização Disponível"
      className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-50 max-w-sm w-[calc(100%-2rem)] p-4 rounded-2xl bg-surface-container/95 border border-brand-red/30 backdrop-blur-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
      id="pwa-update-toast"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-red/20 border border-brand-red/40 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-brand-red" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
            Nova Versão do CineStream
          </h4>
          <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
            Uma atualização com melhorias de velocidade e estabilidade está disponível.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="px-3.5 py-1.5 bg-brand-red hover:bg-brand-red-hover active:scale-95 text-white font-display font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-brand-red/20"
              id="pwa-update-button"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
              {isUpdating ? 'Atualizando...' : 'Atualizar Agora'}
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Depois
            </button>
          </div>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-gray-500 hover:text-white p-1 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}

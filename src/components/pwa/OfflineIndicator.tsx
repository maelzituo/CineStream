/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline && !showReconnected) return null;

  return (
    <aside
      aria-label="Status da Conexão"
      className="fixed top-20 right-4 z-50 transition-all duration-300 animate-in fade-in slide-in-from-top-3"
      id="pwa-offline-indicator"
    >
      {isOffline ? (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-red-950/90 border border-red-500/40 text-white backdrop-blur-md shadow-2xl">
          <WifiOff className="w-4 h-4 text-brand-red animate-pulse" />
          <div className="text-xs">
            <p className="font-bold text-white leading-tight">Modo Offline</p>
            <p className="text-[10px] text-gray-300">Exibindo conteúdos salvos em cache</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-white backdrop-blur-md shadow-2xl">
          <Wifi className="w-4 h-4 text-emerald-400" />
          <div className="text-xs">
            <p className="font-bold text-emerald-300 leading-tight">Conexão Restaurada</p>
            <p className="text-[10px] text-gray-300">Sincronizando catálogo e nuvem</p>
          </div>
        </div>
      )}
    </aside>
  );
}

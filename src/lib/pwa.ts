/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Interface for BeforeInstallPromptEvent
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type PWAInstallListener = (canInstall: boolean) => void;
type PWAUpdateListener = () => void;

class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isAppStandalone = false;
  private installListeners: Set<PWAInstallListener> = new Set();
  private updateListeners: Set<PWAUpdateListener> = new Set();
  private swRegistration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.checkStandalone();
      this.setupInstallPrompt();
      this.registerServiceWorker();
    }
  }

  public checkStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    this.isAppStandalone = isStandaloneMode;
    return isStandaloneMode;
  }

  public isStandalone(): boolean {
    return this.isAppStandalone;
  }

  public isIOS(): boolean {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  }

  private setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.notifyInstallListeners(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isAppStandalone = true;
      this.notifyInstallListeners(false);
      console.log('[PWA] CineStream instalado com sucesso!');
    });
  }

  public async registerServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    try {
      // Register Service Worker from root
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      this.swRegistration = reg;

      // Check if update is found
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            this.updateAvailable = true;
            this.notifyUpdateListeners();
          }
        });
      });

      // Reload on controller change
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    } catch (error) {
      console.warn('[PWA] Service Worker registration failed:', error);
    }
  }

  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        this.deferredPrompt = null;
        this.notifyInstallListeners(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[PWA] Erro ao disparar prompt de instalação:', err);
      return false;
    }
  }

  public canInstall(): boolean {
    return !!this.deferredPrompt && !this.isAppStandalone;
  }

  public isUpdateAvailable(): boolean {
    return this.updateAvailable;
  }

  public applyUpdate() {
    if (this.swRegistration && this.swRegistration.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }

  public onInstallChange(listener: PWAInstallListener) {
    this.installListeners.add(listener);
    listener(this.canInstall());
    return () => {
      this.installListeners.delete(listener);
    };
  }

  public onUpdateAvailable(listener: PWAUpdateListener) {
    this.updateListeners.add(listener);
    if (this.updateAvailable) listener();
    return () => {
      this.updateListeners.delete(listener);
    };
  }

  private notifyInstallListeners(canInstall: boolean) {
    this.installListeners.forEach((fn) => fn(canInstall));
  }

  private notifyUpdateListeners() {
    this.updateListeners.forEach((fn) => fn());
  }
}

export const pwaManager = new PWAManager();

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SecurityEvent } from '../types';

const SECURITY_LOG_STORAGE_KEY = 'cinestream_security_audit_log';
const BRUTE_FORCE_KEY_PREFIX = 'cinestream_auth_attempts_';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 segundos de bloqueio progressivo após 5 falhas

export class SecurityLogger {
  /**
   * Registra um evento de segurança no log de auditoria
   */
  public static log(
    type: SecurityEvent['type'],
    email?: string,
    details?: string
  ): void {
    try {
      const logs = this.getLogs();
      const newEvent: SecurityEvent = {
        id: 'sec_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        type,
        timestamp: Date.now(),
        email: email ? email.toLowerCase() : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        details,
      };

      // Mantém os últimos 50 eventos para não estourar armazenamento
      const updatedLogs = [newEvent, ...logs].slice(0, 50);
      localStorage.setItem(SECURITY_LOG_STORAGE_KEY, JSON.stringify(updatedLogs));
    } catch (e) {
      console.warn('Falha ao gravar log de segurança:', e);
    }
  }

  /**
   * Recupera os eventos de segurança registrados
   */
  public static getLogs(): SecurityEvent[] {
    try {
      const data = localStorage.getItem(SECURITY_LOG_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Limpa os logs de segurança
   */
  public static clearLogs(): void {
    localStorage.removeItem(SECURITY_LOG_STORAGE_KEY);
  }

  /**
   * Registra uma tentativa falha de autenticação e calcula eventual lockout por força bruta
   */
  public static recordFailedAttempt(email: string): { isLocked: boolean; remainingSeconds: number; attempts: number } {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const storageKey = `${BRUTE_FORCE_KEY_PREFIX}${normalizedEmail}`;
      const recordStr = localStorage.getItem(storageKey);
      
      const now = Date.now();
      let record = recordStr ? JSON.parse(recordStr) : { count: 0, firstAttemptTime: now, lockUntil: 0 };

      // Se o bloqueio anterior expirou, reseta o contador
      if (record.lockUntil && record.lockUntil < now) {
        record = { count: 0, firstAttemptTime: now, lockUntil: 0 };
      }

      record.count += 1;

      if (record.count >= MAX_FAILED_ATTEMPTS) {
        // Multiplicador progressivo para bloqueios repetidos
        const extraMultiplier = Math.floor((record.count - MAX_FAILED_ATTEMPTS) / 2) + 1;
        record.lockUntil = now + (LOCKOUT_DURATION_MS * extraMultiplier);
        this.log('rate_limit_lock', normalizedEmail, `Bloqueio temporário ativado após ${record.count} falhas consecutivas.`);
      }

      localStorage.setItem(storageKey, JSON.stringify(record));

      const isLocked = record.lockUntil > now;
      const remainingSeconds = isLocked ? Math.ceil((record.lockUntil - now) / 1000) : 0;

      return {
        isLocked,
        remainingSeconds,
        attempts: record.count,
      };
    } catch {
      return { isLocked: false, remainingSeconds: 0, attempts: 1 };
    }
  }

  /**
   * Verifica se o usuário/e-mail está atualmente bloqueado por rate limit
   */
  public static checkLockout(email: string): { isLocked: boolean; remainingSeconds: number } {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const storageKey = `${BRUTE_FORCE_KEY_PREFIX}${normalizedEmail}`;
      const recordStr = localStorage.getItem(storageKey);

      if (!recordStr) return { isLocked: false, remainingSeconds: 0 };

      const record = JSON.parse(recordStr);
      const now = Date.now();

      if (record.lockUntil && record.lockUntil > now) {
        return {
          isLocked: true,
          remainingSeconds: Math.ceil((record.lockUntil - now) / 1000),
        };
      }

      return { isLocked: false, remainingSeconds: 0 };
    } catch {
      return { isLocked: false, remainingSeconds: 0 };
    }
  }

  /**
   * Reseta as tentativas falhas após um login com sucesso
   */
  public static resetFailedAttempts(email: string): void {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const storageKey = `${BRUTE_FORCE_KEY_PREFIX}${normalizedEmail}`;
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.warn('Erro ao resetar tentativas:', e);
    }
  }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PasswordValidationResult } from '../types';

/**
 * Validação rigorosa de senha com verificação de critérios de segurança:
 * - Mínimo de 8 caracteres
 * - Pelo menos uma letra maiúscula
 * - Pelo menos uma letra minúscula
 * - Pelo menos um número
 * - Pelo menos um caractere especial
 */
export function validatePassword(password: string): PasswordValidationResult {
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`§±]/.test(password);

  const passedCriteriaCount = [
    minLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar
  ].filter(Boolean).length;

  let score = 0;
  let strengthLabel: PasswordValidationResult['strengthLabel'] = 'Muito Fraca';

  if (password.length === 0) {
    score = 0;
    strengthLabel = 'Muito Fraca';
  } else if (passedCriteriaCount <= 2) {
    score = 1;
    strengthLabel = 'Fraca';
  } else if (passedCriteriaCount === 3 || passedCriteriaCount === 4) {
    score = 2;
    strengthLabel = 'Razoável';
  } else if (passedCriteriaCount === 5 && password.length < 12) {
    score = 3;
    strengthLabel = 'Forte';
  } else if (passedCriteriaCount === 5 && password.length >= 12) {
    score = 4;
    strengthLabel = 'Excelente';
  }

  const isValid = minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  return {
    isValid,
    score,
    strengthLabel,
    errors: {
      minLength: !minLength,
      hasUppercase: !hasUppercase,
      hasLowercase: !hasLowercase,
      hasNumber: !hasNumber,
      hasSpecialChar: !hasSpecialChar,
    }
  };
}

/**
 * Valida e normaliza formato de e-mail (lowercase + RFC regex)
 */
export function validateEmail(email: string): { isValid: boolean; normalized: string; error?: string } {
  const normalized = email.trim().toLowerCase();
  
  if (!normalized) {
    return { isValid: false, normalized: '', error: 'O e-mail é obrigatório.' };
  }

  const emailRegex = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;
  
  if (!emailRegex.test(normalized)) {
    return { isValid: false, normalized, error: 'Formato de e-mail inválido.' };
  }

  return { isValid: true, normalized };
}

/**
 * Valida e sanitiza nome do usuário (mínimo 3 e máximo 60 caracteres)
 */
export function validateName(name: string): { isValid: boolean; sanitized: string; error?: string } {
  const sanitized = name.trim().replace(/\s+/g, ' ');

  if (!sanitized) {
    return { isValid: false, sanitized: '', error: 'O nome é obrigatório.' };
  }

  if (sanitized.length < 3) {
    return { isValid: false, sanitized, error: 'O nome deve ter no mínimo 3 caracteres.' };
  }

  if (sanitized.length > 60) {
    return { isValid: false, sanitized, error: 'O nome deve ter no máximo 60 caracteres.' };
  }

  // Remove caracteres potencialmente perigosos para XSS
  const safeName = sanitized.replace(/[<>"/\\&]/g, '');

  return { isValid: true, sanitized: safeName };
}

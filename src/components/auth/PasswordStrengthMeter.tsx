/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Check, X } from 'lucide-react';
import { PasswordValidationResult } from '../../types';

interface PasswordStrengthMeterProps {
  validation: PasswordValidationResult;
  showRequirements?: boolean;
}

export default function PasswordStrengthMeter({
  validation,
  showRequirements = true,
}: PasswordStrengthMeterProps) {
  const { score, strengthLabel, errors } = validation;

  const getBarColor = () => {
    switch (score) {
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-amber-500';
      case 3:
        return 'bg-yellow-400';
      case 4:
        return 'bg-emerald-500';
      default:
        return 'bg-gray-700';
    }
  };

  const getTextColor = () => {
    switch (score) {
      case 1:
        return 'text-red-400';
      case 2:
        return 'text-amber-400';
      case 3:
        return 'text-yellow-300';
      case 4:
        return 'text-emerald-400';
      default:
        return 'text-gray-500';
    }
  };

  const criteria = [
    { label: 'Pelo menos 8 caracteres', pass: !errors.minLength },
    { label: 'Uma letra maiúscula (A-Z)', pass: !errors.hasUppercase },
    { label: 'Uma letra minúscula (a-z)', pass: !errors.hasLowercase },
    { label: 'Pelo menos um número (0-9)', pass: !errors.hasNumber },
    { label: 'Um símbolo especial (!@#$%...)', pass: !errors.hasSpecialChar },
  ];

  return (
    <div className="space-y-2 pt-1">
      {/* Barra de Força */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-[10px] font-sans font-semibold">
          <span className="text-gray-400 uppercase tracking-wider">Força da Senha:</span>
          <span className={`${getTextColor()} font-bold`}>{strengthLabel}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5">
          <div className={`h-full rounded-full transition-all duration-300 ${score >= 1 ? getBarColor() : 'bg-white/10'}`} />
          <div className={`h-full rounded-full transition-all duration-300 ${score >= 2 ? getBarColor() : 'bg-white/10'}`} />
          <div className={`h-full rounded-full transition-all duration-300 ${score >= 3 ? getBarColor() : 'bg-white/10'}`} />
          <div className={`h-full rounded-full transition-all duration-300 ${score >= 4 ? getBarColor() : 'bg-white/10'}`} />
        </div>
      </div>

      {/* Lista de Critérios */}
      {showRequirements && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1.5 bg-surface-container/60 p-2.5 rounded-xl border border-white/5">
          {criteria.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-[11px] font-sans">
              {item.pass ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              )}
              <span className={item.pass ? 'text-gray-200' : 'text-gray-500'}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

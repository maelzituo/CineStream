/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Check, Image as ImageIcon, Link2 } from 'lucide-react';

export const CINEMA_AVATARS = [
  {
    id: 'avatar-1',
    name: 'Neo (Matrix)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=185&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-2',
    name: 'Mia Wallace (Pulp Fiction)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=185&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-3',
    name: 'Tony Stark (Homem de Ferro)',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=185&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-4',
    name: 'Ellen Ripley (Alien)',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=185&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-5',
    name: 'Tyler Durden (Clube da Luta)',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=185&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-6',
    name: 'Cléo (Cinema Noir)',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=185&auto=format&fit=crop&q=80',
  },
];

interface AvatarPickerProps {
  selectedUrl: string;
  onSelect: (url: string) => void;
}

export default function AvatarPicker({ selectedUrl, onSelect }: AvatarPickerProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  const handleApplyCustom = () => {
    if (customUrl.trim().startsWith('http')) {
      onSelect(customUrl.trim());
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-display font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-brand-red" />
          Escolha seu Avatar de Perfil
        </label>
        <button
          type="button"
          onClick={() => setShowCustomInput(!showCustomInput)}
          className="text-[11px] font-sans text-brand-red hover:underline cursor-pointer flex items-center gap-1"
        >
          <Link2 className="w-3 h-3" />
          {showCustomInput ? 'Ver Avatares' : 'Inserir Link'}
        </button>
      </div>

      {!showCustomInput ? (
        <div className="grid grid-cols-6 gap-2">
          {CINEMA_AVATARS.map((avatar) => {
            const isSelected = selectedUrl === avatar.url;
            return (
              <button
                type="button"
                key={avatar.id}
                onClick={() => onSelect(avatar.url)}
                title={avatar.name}
                className={`relative aspect-square rounded-full p-0.5 border-2 transition-all cursor-pointer hover:scale-105 active:scale-95 overflow-hidden ${
                  isSelected
                    ? 'border-brand-red ring-2 ring-brand-red/30 shadow-md shadow-brand-red/20'
                    : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/40'
                }`}
              >
                <img
                  referrerPolicy="no-referrer"
                  src={avatar.url}
                  alt={avatar.name}
                  className="w-full h-full object-cover rounded-full"
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-brand-red/40 backdrop-blur-[1px] flex items-center justify-center rounded-full">
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://exemplo.com/sua-foto.jpg"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="flex-1 bg-surface-container border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red"
          />
          <button
            type="button"
            onClick={handleApplyCustom}
            className="px-3 py-2 bg-brand-red hover:bg-brand-red-hover text-white text-xs font-display font-bold rounded-xl cursor-pointer transition-all active:scale-95"
          >
            Usar
          </button>
        </div>
      )}
    </div>
  );
}

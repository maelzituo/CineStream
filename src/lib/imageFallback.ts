/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// Fallback high-res movie posters and backdrops (tested, reliable TMDb/Unsplash CDNs)
export const DEFAULT_POSTER_FALLBACK =
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80';

export const DEFAULT_BACKDROP_FALLBACK =
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1280&auto=format&fit=crop&q=80';

export const DEFAULT_AVATAR_FALLBACK =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

/**
 * Handle image error by setting fallback source smoothly
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackType: 'poster' | 'backdrop' | 'avatar' = 'poster'
) {
  const target = event.currentTarget;
  const fallback =
    fallbackType === 'backdrop'
      ? DEFAULT_BACKDROP_FALLBACK
      : fallbackType === 'avatar'
      ? DEFAULT_AVATAR_FALLBACK
      : DEFAULT_POSTER_FALLBACK;

  // Prevent infinite loop if fallback itself fails
  if (target.src !== fallback) {
    target.src = fallback;
  }
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Movie } from '../types';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  thumbnailLink?: string;
  webContentLink?: string;
  createdTime?: string;
  description?: string;
}

const DRIVE_FOLDER_ID = '1dLqgWmstRF6k_VTcVFgEd9jigR3207-E';

// Clean filename into a clean movie title
export function cleanMovieTitle(filename: string): string {
  // Remove file extension
  let title = filename.replace(/\.[^/.]+$/, "");
  // Replace dots, hyphens, underscores with spaces
  title = title.replace(/[._-]/g, " ");
  // Remove technical words like 1080p, 720p, webrip, h264, x264, bluray, dual, audio, dublado, legendado, etc. (case insensitive)
  title = title.replace(/\b(1080p|720p|4k|2160p|webrip|h264|x264|bluray|dual|audio|dublado|legendado|multi|aac|dd5|xvid|ac3|h265|hevc|web dl|rip)\b/gi, "");
  // Remove brackets and parenthesized content
  title = title.replace(/\[.*?\]|\(.*?\)/g, "");
  // Strip duplicate whitespace and trim
  return title.replace(/\s+/g, " ").trim();
}

// Generate consistent beautiful cinematic backdrops/posters based on string hash
function getThemedPlaceholder(title: string): { imageUrl: string; backdropUrl: string; genres: string[] } {
  const images = [
    {
      imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
      genres: ['Cinema', 'Drive']
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=600&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
      genres: ['Ficção', 'Drive']
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=1200&q=80',
      genres: ['Aventura', 'Drive']
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80',
      genres: ['Clássico', 'Drive']
    }
  ];

  // Simple string hashing
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % images.length;
  return images[index];
}

export async function fetchGoogleDriveMovies(accessToken: string): Promise<Movie[]> {
  try {
    const query = `'${DRIVE_FOLDER_ID}' in parents and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,thumbnailLink,webContentLink,createdTime,description)&pageSize=50`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro na API do Google Drive: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const files: DriveFile[] = data.files || [];

    // Filter to video files or common file containers (or let all through if you want to handle them)
    const videoFiles = files.filter(f => 
      f.mimeType.startsWith('video/') || 
      f.name.endsWith('.mp4') || 
      f.name.endsWith('.mkv') || 
      f.name.endsWith('.avi') ||
      f.name.endsWith('.webm')
    );

    return videoFiles.map((file) => {
      const cleanTitle = cleanMovieTitle(file.name);
      const theme = getThemedPlaceholder(cleanTitle);

      // Enhance thumbnail if it has `=s220` (Google Drive standard thumbnail size) by replacing with larger image size
      let image = file.thumbnailLink ? file.thumbnailLink.replace(/=s\d+/, '=s600') : theme.imageUrl;
      let backdrop = file.thumbnailLink ? file.thumbnailLink.replace(/=s\d+/, '=s1200') : theme.backdropUrl;

      // Calculate video streaming URL using alt=media and access_token
      const videoUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&access_token=${accessToken}`;

      return {
        id: `gdrive_${file.id}`,
        title: cleanTitle,
        description: file.description || `Filme importado de forma totalmente integrada e segura da sua pasta compartilhada do Google Drive (${file.name}).`,
        imageUrl: image,
        backdropUrl: backdrop,
        year: file.createdTime ? new Date(file.createdTime).getFullYear() : 2026,
        ageRating: 'L',
        duration: file.size ? `${Math.round(parseInt(file.size) / (1024 * 1024))} MB` : 'Google Drive',
        genres: theme.genres,
        rating: 8.5,
        videoUrl,
        isOriginal: false,
        similarIds: []
      };
    });
  } catch (error) {
    console.error('Erro ao buscar arquivos da pasta do Google Drive:', error);
    throw error;
  }
}

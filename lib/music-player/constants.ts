/**
 * Music player constants.
 */

import type { PlayMode } from './types'

export const SUPPORTED_EXTENSIONS = ['.mp3', '.m4a', '.ogg', '.flac'] as const

export const MIME_TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
}

export const DEFAULT_PLAY_MODE: PlayMode = 'cdOrder'

export const MODE_LABELS: Record<PlayMode, string> = {
  random: 'Random',
  byArtist: 'By artist',
  byAlbum: 'By album',
  cdOrder: 'CD order',
}

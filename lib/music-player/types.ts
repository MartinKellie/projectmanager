/**
 * Music player types.
 * Track references a file via File System Access API handle.
 */

export type PlayMode = 'random' | 'byArtist' | 'byAlbum' | 'cdOrder'

/** Parsed track metadata; fileHandle kept in memory (not serialisable). */
export interface Track {
  /** Handle to the audio file (valid for session). */
  fileHandle: FileSystemFileHandle
  /** Relative path from chosen root. */
  path: string
  artist: string
  album: string
  /** 1-based track number for ordering. */
  trackNo: number
  title: string
  /** Album art from ID3/tags, if present. */
  picture?: Blob
}

/** Result of scanning a folder: handles + paths before metadata parse. */
export interface ScannedEntry {
  fileHandle: FileSystemFileHandle
  path: string
}

/** Parsed metadata only (for fallback / cache). */
export interface TrackMetadata {
  artist: string
  album: string
  trackNo: number
  title: string
  picture?: Blob
}

/** Parse audio file metadata from tags; fallback to path/filename. Tag parsing is loaded via dynamic import so SSR does not bundle `music-metadata-browser`. */

import type { ScannedEntry, Track, TrackMetadata } from './types'

/** Derive artist, album, trackNo, title from path like "Artist/Album/01 - Title.mp3". */
function metadataFromPath(path: string, fileName: string): TrackMetadata {
  const parts = path.split('/').filter(Boolean)
  const artist = parts.length >= 1 ? parts[0] : 'Unknown'
  const album = parts.length >= 2 ? parts[1] : 'Unknown'
  const baseName = fileName.replace(/\.[^.]+$/, '')
  const trackMatch = baseName.match(/^(\d+)\s*[-.]?\s*(.*)$/)
  const trackNo = trackMatch ? parseInt(trackMatch[1], 10) : 0
  const title = trackMatch ? trackMatch[2].trim() || baseName : baseName
  return { artist, album, trackNo: trackNo || 0, title }
}

/** Parse one file: tags first, then path fallback. */
export async function parseFileMetadata(
  entry: ScannedEntry
): Promise<TrackMetadata> {
  const fallback = metadataFromPath(entry.path, entry.path.split('/').pop() || '')
  try {
    const file = await entry.fileHandle.getFile()
    const { parseBlob, selectCover } = await import('music-metadata-browser')
    const meta = await parseBlob(file)
    const common = meta.common
    const artist = common.artist ?? common.albumartist ?? fallback.artist
    const album = common.album ?? fallback.album
    const trackNo = common.track?.no ?? fallback.trackNo
    const title = common.title ?? fallback.title
    let picture: Blob | undefined
    const pictureList = common.picture
    if (pictureList && pictureList.length > 0) {
      const selected = selectCover(pictureList)
      if (selected && selected.data) {
        const arr = Uint8Array.from(selected.data as ArrayLike<number>)
        picture = new Blob([arr], { type: selected.format || 'image/jpeg' })
      }
    }
    return { artist: artist || fallback.artist, album: album || fallback.album, trackNo: trackNo ?? fallback.trackNo, title: title || fallback.title, picture }
  } catch {
    return fallback
  }
}

/** Build full Track from scanned entry and parsed metadata. */
export function toTrack(entry: ScannedEntry, meta: TrackMetadata): Track {
  return {
    fileHandle: entry.fileHandle,
    path: entry.path,
    artist: meta.artist,
    album: meta.album,
    trackNo: meta.trackNo,
    title: meta.title,
    picture: meta.picture,
  }
}

/**
 * Recursively scan a directory for supported audio files.
 * Uses File System Access API (values() may not be in all TS libs).
 */

import { SUPPORTED_EXTENSIONS } from './constants'
import type { ScannedEntry } from './types'

interface DirHandleWithValues {
  values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>
}

function hasSupportedExtension(name: string): boolean {
  const lower = name.toLowerCase()
  return SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

/**
 * Recursively collect audio file handles and relative paths from a directory.
 */
export async function scanFolder(
  dirHandle: FileSystemDirectoryHandle,
  basePath = ''
): Promise<ScannedEntry[]> {
  const results: ScannedEntry[] = []
  const handle = dirHandle as unknown as DirHandleWithValues

  try {
    for await (const entry of handle.values()) {
      const entryPath = basePath ? `${basePath}/${entry.name}` : entry.name

      if (entry.kind === 'file') {
        if (hasSupportedExtension(entry.name)) {
          results.push({ fileHandle: entry as FileSystemFileHandle, path: entryPath })
        }
      } else if (entry.kind === 'directory') {
        const sub = await scanFolder(
          entry as FileSystemDirectoryHandle,
          entryPath
        )
        results.push(...sub)
      }
    }
  } catch (err) {
    console.error('Error scanning folder:', err)
    throw err
  }

  return results
}

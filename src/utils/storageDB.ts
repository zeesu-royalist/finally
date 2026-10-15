import { SavedProject, VideoClip, ImageClip, AudioClip } from '../types/editor';

const DB_NAME = 'finallyDB';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_MEDIA = 'media_blobs';

let dbInstance: IDBDatabase | null = null;

/**
 * Initializes and opens the IndexedDB database for project and binary media persistence.
 */
export function openDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available in this environment'));
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_MEDIA)) {
        db.createObjectStore(STORE_MEDIA, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('Failed to open IndexedDB:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Stores a binary Blob / File in IndexedDB.
 */
export async function saveMediaBlob(
  id: string,
  blob: Blob,
  name?: string,
  mimeType?: string
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_MEDIA, 'readwrite');
      const store = transaction.objectStore(STORE_MEDIA);
      const record = {
        id,
        blob,
        name: name || 'Media file',
        mimeType: mimeType || blob.type,
        size: blob.size,
        updatedAt: Date.now(),
      };
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`IndexedDB saveMediaBlob failed for ${id}:`, err);
  }
}

/**
 * Retrieves a binary Blob from IndexedDB by its persistent mediaId.
 */
export async function getMediaBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_MEDIA, 'readonly');
      const store = transaction.objectStore(STORE_MEDIA);
      const request = store.get(id);

      request.onsuccess = () => {
        if (request.result && request.result.blob) {
          resolve(request.result.blob);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`IndexedDB getMediaBlob failed for ${id}:`, err);
    return null;
  }
}

/**
 * Deletes a binary media blob from IndexedDB.
 */
export async function deleteMediaBlob(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_MEDIA, 'readwrite');
      const store = transaction.objectStore(STORE_MEDIA);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`IndexedDB deleteMediaBlob failed for ${id}:`, err);
  }
}

/**
 * Saves current project state to IndexedDB.
 */
export async function saveProjectData(project: SavedProject): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = transaction.objectStore(STORE_PROJECTS);
      const request = store.put({
        ...project,
        id: 'current_project',
        updatedAt: Date.now(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB saveProjectData failed:', err);
  }
}

/**
 * Loads saved project state from IndexedDB.
 */
export async function getProjectData(): Promise<SavedProject | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_PROJECTS, 'readonly');
      const store = transaction.objectStore(STORE_PROJECTS);
      const request = store.get('current_project');

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result as SavedProject);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB getProjectData failed:', err);
    return null;
  }
}

/**
 * Clears current project data and associated media blobs from IndexedDB.
 */
export async function clearAllProjectData(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_PROJECTS, STORE_MEDIA], 'readwrite');
      transaction.objectStore(STORE_PROJECTS).clear();
      transaction.objectStore(STORE_MEDIA).clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn('IndexedDB clearAllProjectData failed:', err);
  }
}

/**
 * Helper to convert any URL (blob: or data:) to a binary Blob.
 */
export async function urlToBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  return await response.blob();
}

/**
 * Rehydrates clip session URLs from persistent IndexedDB media blobs upon page reload.
 */
export async function rehydrateClips(
  videoClips: VideoClip[],
  imageClips: ImageClip[],
  audioClips: AudioClip[]
): Promise<{
  videoClips: VideoClip[];
  imageClips: ImageClip[];
  audioClips: AudioClip[];
}> {
  // Use a cache map so split clips sharing the same mediaId reuse a single Object URL
  const mediaUrlMap = new Map<string, string>();

  const getOrCreateUrl = async (mediaId: string): Promise<string | null> => {
    if (mediaUrlMap.has(mediaId)) {
      return mediaUrlMap.get(mediaId)!;
    }
    const blob = await getMediaBlob(mediaId);
    if (blob) {
      const url = URL.createObjectURL(blob);
      mediaUrlMap.set(mediaId, url);
      return url;
    }
    return null;
  };

  // 1. Rehydrate Video Clips
  const restoredVideos: VideoClip[] = [];
  for (const clip of videoClips) {
    if (clip.mediaId) {
      const url = await getOrCreateUrl(clip.mediaId);
      if (url) {
        restoredVideos.push({
          ...clip,
          url,
        });
        continue;
      }
    }
    restoredVideos.push(clip);
  }

  // 2. Rehydrate Image Clips
  const restoredImages: ImageClip[] = [];
  for (const clip of imageClips) {
    if (clip.mediaId) {
      const url = await getOrCreateUrl(clip.mediaId);
      if (url) {
        restoredImages.push({
          ...clip,
          url,
        });
        continue;
      }
    }
    restoredImages.push(clip);
  }

  // 3. Rehydrate Audio Clips
  const restoredAudios: AudioClip[] = [];
  for (const clip of audioClips) {
    if (clip.mediaId) {
      const url = await getOrCreateUrl(clip.mediaId);
      if (url) {
        restoredAudios.push({
          ...clip,
          url,
        });
        continue;
      }
    }
    restoredAudios.push(clip);
  }

  return {
    videoClips: restoredVideos,
    imageClips: restoredImages,
    audioClips: restoredAudios,
  };
}

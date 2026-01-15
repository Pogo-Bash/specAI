/**
 * IndexedDB wrapper for single-slot crash recovery
 * DB name: 'codeeths-recovery'
 * Store name: 'workspace'
 * Single key: 'current'
 */

const DB_NAME = 'codeeths-recovery'
const STORE_NAME = 'workspace'
const RECOVERY_KEY = 'current'

let db = null

/**
 * Open/create the IndexedDB database
 */
export async function initRecoveryDB() {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)

    request.onerror = () => {
      console.error('Failed to open recovery database:', request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = event.target.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME)
      }
    }
  })
}

/**
 * Save current workspace state for crash recovery
 * @param {Object} state - The workspace state to save
 * @param {string} state.workspaceName - Name of the workspace
 * @param {Object} state.fileTree - File tree from fileSystem store
 * @param {string} state.activeFilePath - Currently active file path
 * @param {string} state.previewHtmlFile - Preview HTML file path
 * @param {string} state.previewCssFile - Preview CSS file path
 * @param {string} state.previewJsFile - Preview JS file path
 * @param {Object|null} state.source - Source info { type: 'zip'|'github', name: string } or null
 */
export async function saveRecoveryState(state) {
  try {
    const database = await initRecoveryDB()

    const recoveryData = {
      ...state,
      timestamp: Date.now()
    }

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(recoveryData, RECOVERY_KEY)

      request.onerror = () => {
        console.error('Failed to save recovery state:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  } catch (error) {
    console.error('Failed to save recovery state:', error)
  }
}

/**
 * Load saved recovery state
 * @returns {Promise<Object|null>} The saved state or null if none exists
 */
export async function loadRecoveryState() {
  try {
    const database = await initRecoveryDB()

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(RECOVERY_KEY)

      request.onerror = () => {
        console.error('Failed to load recovery state:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        resolve(request.result || null)
      }
    })
  } catch (error) {
    console.error('Failed to load recovery state:', error)
    return null
  }
}

/**
 * Clear the recovery slot (call after successful export)
 */
export async function clearRecoveryState() {
  try {
    const database = await initRecoveryDB()

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(RECOVERY_KEY)

      request.onerror = () => {
        console.error('Failed to clear recovery state:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  } catch (error) {
    console.error('Failed to clear recovery state:', error)
  }
}

/**
 * Quick check if recovery data exists
 * @returns {Promise<boolean>}
 */
export async function hasRecoveryState() {
  try {
    const state = await loadRecoveryState()
    return state !== null
  } catch {
    return false
  }
}

/**
 * Format timestamp as relative time (e.g., "5 minutes ago")
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string}
 */
export function formatRelativeTime(timestamp) {
  const now = Date.now()
  const diffMs = now - timestamp
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

  return new Date(timestamp).toLocaleDateString()
}

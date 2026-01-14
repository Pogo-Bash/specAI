/**
 * Git Import Composable
 * Uses GitHub API to fetch repository contents for public repos
 */

// File extensions that are safe to import as text
const TEXT_EXTENSIONS = new Set([
  'html', 'htm', 'css', 'scss', 'sass', 'less',
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  'json', 'xml', 'svg', 'md', 'txt', 'yaml', 'yml',
  'vue', 'svelte', 'astro',
  'py', 'rb', 'php', 'java', 'c', 'cpp', 'h', 'hpp',
  'go', 'rs', 'swift', 'kt', 'scala',
  'sh', 'bash', 'zsh', 'fish',
  'sql', 'graphql', 'gql',
  'env', 'gitignore', 'dockerignore', 'editorconfig',
  'prettierrc', 'eslintrc', 'babelrc',
  'lock', 'toml', 'ini', 'conf', 'cfg'
])

// Files/folders to skip during import
const SKIP_PATTERNS = [
  'node_modules',
  '.git',
  '.DS_Store',
  'Thumbs.db',
  '__pycache__',
  '.pytest_cache',
  '.venv',
  'venv',
  'dist',
  'build',
  '.next',
  '.nuxt',
  'coverage',
  '.nyc_output'
]

/**
 * Parse a GitHub URL to extract owner, repo, and optional branch/path
 * Supports formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/tree/branch
 * - https://github.com/owner/repo/tree/branch/path/to/folder
 * - github.com/owner/repo
 * - owner/repo
 */
export function parseGitHubUrl(url) {
  // Clean up the URL
  let cleaned = url.trim()
    .replace(/^https?:\/\//, '')
    .replace(/^github\.com\//, '')
    .replace(/\.git$/, '')
    .replace(/\/$/, '')

  // Handle full GitHub URL with tree/branch
  const treeMatch = cleaned.match(/^([^/]+)\/([^/]+)\/tree\/([^/]+)(?:\/(.+))?$/)
  if (treeMatch) {
    return {
      owner: treeMatch[1],
      repo: treeMatch[2],
      branch: treeMatch[3],
      path: treeMatch[4] || ''
    }
  }

  // Handle simple owner/repo format
  const simpleMatch = cleaned.match(/^([^/]+)\/([^/]+)$/)
  if (simpleMatch) {
    return {
      owner: simpleMatch[1],
      repo: simpleMatch[2],
      branch: null, // Will use default branch
      path: ''
    }
  }

  return null
}

/**
 * Get repository info including default branch
 */
export async function getRepoInfo(owner, repo) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Repository not found. Make sure the URL is correct and the repo is public.')
    }
    if (response.status === 403) {
      throw new Error('API rate limit exceeded. Please try again later.')
    }
    throw new Error(`Failed to fetch repository info: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get list of branches for a repository
 */
export async function getBranches(owner, repo) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`)

  if (!response.ok) {
    throw new Error(`Failed to fetch branches: ${response.statusText}`)
  }

  const branches = await response.json()
  return branches.map(b => b.name)
}

/**
 * Recursively fetch repository contents
 */
export async function fetchRepoContents(owner, repo, branch, path = '') {
  const url = path
    ? `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
    : `https://api.github.com/repos/${owner}/${repo}/contents?ref=${branch}`

  const response = await fetch(url)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Path not found in repository.')
    }
    throw new Error(`Failed to fetch contents: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Check if a file should be skipped based on patterns
 */
function shouldSkip(name) {
  return SKIP_PATTERNS.some(pattern => name === pattern || name.startsWith(pattern + '/'))
}

/**
 * Check if a file is a text file based on extension
 */
function isTextFile(filename) {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  // Files without extensions that are commonly text
  if (!filename.includes('.')) {
    const textFileNames = ['Makefile', 'Dockerfile', 'Procfile', 'LICENSE', 'README', 'CHANGELOG']
    return textFileNames.some(name => filename.toUpperCase().includes(name.toUpperCase()))
  }
  return TEXT_EXTENSIONS.has(ext)
}

/**
 * Get a preview of repository files (without downloading content)
 * Returns a flat list of files with metadata
 */
export async function getRepoPreview(owner, repo, branch, basePath = '', maxFiles = 500) {
  const files = []
  const dirs = [basePath]

  while (dirs.length > 0 && files.length < maxFiles) {
    const currentPath = dirs.shift()

    try {
      const contents = await fetchRepoContents(owner, repo, branch, currentPath)

      // Handle single file response (when basePath is a file)
      if (!Array.isArray(contents)) {
        if (contents.type === 'file' && !shouldSkip(contents.name) && isTextFile(contents.name)) {
          files.push({
            path: '/' + contents.path,
            size: contents.size,
            sha: contents.sha,
            download_url: contents.download_url
          })
        }
        continue
      }

      for (const item of contents) {
        if (shouldSkip(item.name)) continue

        if (item.type === 'dir') {
          dirs.push(item.path)
        } else if (item.type === 'file' && isTextFile(item.name)) {
          files.push({
            path: '/' + item.path,
            size: item.size,
            sha: item.sha,
            download_url: item.download_url
          })
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch ${currentPath}:`, error)
      // Continue with other directories
    }
  }

  return files
}

/**
 * Download file content from GitHub
 */
async function downloadFileContent(downloadUrl) {
  const response = await fetch(downloadUrl)
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`)
  }
  return response.text()
}

/**
 * Import files from GitHub repository into a file tree structure
 * @param {Array} files - Array of file objects from getRepoPreview
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Object} - File tree structure compatible with fileSystem store
 */
export async function importFromGitHub(files, onProgress = null) {
  const fileTree = {
    type: 'directory',
    children: {}
  }

  let completed = 0
  const total = files.length

  // Process files in batches to avoid rate limiting
  const batchSize = 10
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize)

    await Promise.all(batch.map(async (file) => {
      try {
        const content = await downloadFileContent(file.download_url)

        // Parse path and create directory structure
        // Remove leading slash and any base path prefix
        const pathParts = file.path.split('/').filter(p => p)
        let current = fileTree

        // Create directories
        for (let j = 0; j < pathParts.length - 1; j++) {
          const dirName = pathParts[j]
          if (!current.children[dirName]) {
            current.children[dirName] = {
              type: 'directory',
              children: {}
            }
          }
          current = current.children[dirName]
        }

        // Add file
        const fileName = pathParts[pathParts.length - 1]
        current.children[fileName] = {
          type: 'file',
          content,
          binary: false,
          modified: false
        }

        completed++
        if (onProgress) {
          onProgress(completed, total)
        }
      } catch (error) {
        console.warn(`Failed to download ${file.path}:`, error)
        completed++
        if (onProgress) {
          onProgress(completed, total)
        }
      }
    }))

    // Small delay between batches to be nice to GitHub API
    if (i + batchSize < files.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return fileTree
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

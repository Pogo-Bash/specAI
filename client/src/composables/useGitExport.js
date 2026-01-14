/**
 * Git Export Composable
 * Uses GitHub API to push files to repositories
 */

const TOKEN_STORAGE_KEY = 'github_pat'

/**
 * Get stored GitHub token from localStorage
 */
export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

/**
 * Store GitHub token in localStorage
 */
export function storeToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
  } catch (e) {
    console.warn('Failed to store GitHub token:', e)
  }
}

/**
 * Clear stored GitHub token
 */
export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch (e) {
    console.warn('Failed to clear GitHub token:', e)
  }
}

/**
 * Validate token by fetching user info
 */
export async function validateToken(token) {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid token. Please check your Personal Access Token.')
    }
    throw new Error(`Token validation failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get user's repositories
 */
export async function getUserRepos(token) {
  const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch repositories: ${response.statusText}`)
  }

  const repos = await response.json()
  return repos.filter(r => r.permissions?.push)
}

/**
 * Get repository info
 */
export async function getRepoInfo(token, owner, repo) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Repository not found')
    }
    throw new Error(`Failed to fetch repository: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get the default branch of a repository
 */
export async function getDefaultBranch(token, owner, repo) {
  const info = await getRepoInfo(token, owner, repo)
  return info.default_branch
}

/**
 * Get branches for a repository
 */
export async function getBranches(token, owner, repo) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch branches: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get the latest commit SHA for a branch
 */
export async function getLatestCommitSha(token, owner, repo, branch) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to get branch reference: ${response.statusText}`)
  }

  const ref = await response.json()
  return ref.object.sha
}

/**
 * Create a blob for file content
 */
async function createBlob(token, owner, repo, content) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: content,
      encoding: 'utf-8'
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to create blob: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Create a tree with multiple files
 */
async function createTree(token, owner, repo, baseTreeSha, files) {
  const tree = files.map(file => ({
    path: file.path.startsWith('/') ? file.path.slice(1) : file.path,
    mode: '100644',
    type: 'blob',
    sha: file.sha
  }))

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to create tree: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Create a commit
 */
async function createCommit(token, owner, repo, message, treeSha, parentSha) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      tree: treeSha,
      parents: [parentSha]
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to create commit: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Update branch reference to point to new commit
 */
async function updateRef(token, owner, repo, branch, commitSha) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sha: commitSha,
      force: false
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to update reference: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get the base tree SHA for a commit
 */
async function getBaseTreeSha(token, owner, repo, commitSha) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${commitSha}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to get commit info: ${response.statusText}`)
  }

  const commit = await response.json()
  return commit.tree.sha
}

/**
 * Export files to GitHub repository
 * @param {string} token - GitHub Personal Access Token
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Target branch
 * @param {Array} files - Array of {path, content} objects
 * @param {string} message - Commit message
 * @param {Function} onProgress - Progress callback (current, total, stage)
 * @returns {Object} - Result with commit URL
 */
export async function exportToGitHub(token, owner, repo, branch, files, message, onProgress = null) {
  const total = files.length + 3 // files + tree + commit + update ref
  let current = 0

  const updateProgress = (stage) => {
    if (onProgress) onProgress(current, total, stage)
  }

  // Step 1: Get latest commit SHA
  updateProgress('Getting branch info...')
  const latestCommitSha = await getLatestCommitSha(token, owner, repo, branch)
  const baseTreeSha = await getBaseTreeSha(token, owner, repo, latestCommitSha)

  // Step 2: Create blobs for each file
  const fileBlobs = []
  for (const file of files) {
    updateProgress(`Uploading ${file.path}...`)
    const blob = await createBlob(token, owner, repo, file.content)
    fileBlobs.push({
      path: file.path,
      sha: blob.sha
    })
    current++
    updateProgress(`Uploaded ${file.path}`)
  }

  // Step 3: Create a tree with all files
  current++
  updateProgress('Creating tree...')
  const tree = await createTree(token, owner, repo, baseTreeSha, fileBlobs)

  // Step 4: Create a commit
  current++
  updateProgress('Creating commit...')
  const commit = await createCommit(token, owner, repo, message, tree.sha, latestCommitSha)

  // Step 5: Update branch reference
  current++
  updateProgress('Updating branch...')
  await updateRef(token, owner, repo, branch, commit.sha)

  return {
    success: true,
    commitSha: commit.sha,
    commitUrl: `https://github.com/${owner}/${repo}/commit/${commit.sha}`,
    repoUrl: `https://github.com/${owner}/${repo}`
  }
}

/**
 * Create a new repository
 */
export async function createRepository(token, name, description = '', isPrivate = false) {
  const response = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      description,
      private: isPrivate,
      auto_init: true // Initialize with README to have a commit to build on
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `Failed to create repository: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Parse a GitHub repository URL to extract owner and repo
 */
export function parseRepoUrl(url) {
  const cleaned = url.trim()
    .replace(/^https?:\/\//, '')
    .replace(/^github\.com\//, '')
    .replace(/\.git$/, '')
    .replace(/\/$/, '')

  const match = cleaned.match(/^([^/]+)\/([^/]+)/)
  if (match) {
    return { owner: match[1], repo: match[2] }
  }

  return null
}

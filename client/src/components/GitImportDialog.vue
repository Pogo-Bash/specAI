<template>
  <div v-if="visible" class="modal modal-open">
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        Import from GitHub
      </h3>

      <!-- Step 1: URL Input -->
      <div v-if="step === 'url'">
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">GitHub Repository URL</span>
          </label>
          <input
            v-model="repoUrl"
            type="text"
            placeholder="https://github.com/owner/repo or owner/repo"
            class="input input-bordered w-full"
            :class="{ 'input-error': urlError }"
            @keyup.enter="fetchRepoInfo"
          />
          <label v-if="urlError" class="label">
            <span class="label-text-alt text-error">{{ urlError }}</span>
          </label>
        </div>

        <div class="alert alert-info mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div class="text-sm">
            <p>Supported formats:</p>
            <ul class="list-disc list-inside text-xs opacity-80 mt-1">
              <li>https://github.com/owner/repo</li>
              <li>github.com/owner/repo</li>
              <li>owner/repo</li>
              <li>https://github.com/owner/repo/tree/branch/path</li>
            </ul>
          </div>
        </div>

        <p class="text-sm opacity-70 mb-4">
          Only public repositories are supported. Binary files (images, etc.) will be skipped.
        </p>
      </div>

      <!-- Step 2: Branch Selection -->
      <div v-else-if="step === 'branch'">
        <div class="mb-4">
          <div class="flex items-center gap-2 mb-2">
            <span class="font-semibold">{{ repoInfo.full_name }}</span>
            <a :href="repoInfo.html_url" target="_blank" class="btn btn-xs btn-ghost">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <p v-if="repoInfo.description" class="text-sm opacity-70 mb-4">{{ repoInfo.description }}</p>
        </div>

        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Branch</span>
          </label>
          <select v-model="selectedBranch" class="select select-bordered w-full">
            <option v-for="branch in branches" :key="branch" :value="branch">
              {{ branch }}
              <span v-if="branch === repoInfo.default_branch">(default)</span>
            </option>
          </select>
        </div>

        <div v-if="parsedUrl.path" class="form-control mb-4">
          <label class="label">
            <span class="label-text">Subdirectory</span>
          </label>
          <input
            v-model="subPath"
            type="text"
            placeholder="(optional) path/to/folder"
            class="input input-bordered w-full"
          />
          <label class="label">
            <span class="label-text-alt opacity-70">Leave empty to import entire repo</span>
          </label>
        </div>
      </div>

      <!-- Step 3: Preview and Confirm -->
      <div v-else-if="step === 'preview'">
        <div class="alert alert-info mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <h4 class="font-bold">Import Mode</h4>
            <div class="text-sm">Choose how to import these files</div>
          </div>
        </div>

        <!-- Import Mode Selection -->
        <div class="flex gap-2 mb-4">
          <label class="label cursor-pointer flex-1 border rounded-lg p-3" :class="importMode === 'merge' && 'border-primary bg-primary/10'">
            <span class="label-text flex-1">
              <div class="font-semibold">Merge</div>
              <div class="text-xs opacity-70">Add files, keep existing</div>
            </span>
            <input type="radio" value="merge" v-model="importMode" class="radio radio-primary" />
          </label>
          <label class="label cursor-pointer flex-1 border rounded-lg p-3" :class="importMode === 'replace' && 'border-primary bg-primary/10'">
            <span class="label-text flex-1">
              <div class="font-semibold">Replace</div>
              <div class="text-xs opacity-70">Clear all, import only these</div>
            </span>
            <input type="radio" value="replace" v-model="importMode" class="radio radio-primary" />
          </label>
        </div>

        <!-- File Preview -->
        <div class="bg-base-200 rounded-lg p-4 mb-4">
          <div class="flex justify-between items-center mb-2">
            <span class="font-semibold text-sm">Files to import:</span>
            <span class="text-sm opacity-70">{{ previewFiles.length }} files ({{ totalSize }})</span>
          </div>
          <div class="max-h-64 overflow-y-auto">
            <div
              v-for="file in previewFiles"
              :key="file.path"
              class="flex items-center justify-between px-2 py-1 text-sm font-mono hover:bg-base-300 rounded"
            >
              <span class="truncate flex-1 mr-2">{{ file.path }}</span>
              <span class="text-xs opacity-50 whitespace-nowrap">{{ formatFileSize(file.size) }}</span>
            </div>
          </div>
        </div>

        <!-- Warning for replace mode -->
        <div v-if="importMode === 'replace'" class="alert alert-warning mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>This will delete all existing files and folders!</span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center py-8">
        <span class="loading loading-spinner loading-lg mb-4"></span>
        <p class="text-sm opacity-70">{{ loadingMessage }}</p>
        <progress
          v-if="progress.total > 0"
          class="progress progress-primary w-64 mt-4"
          :value="progress.current"
          :max="progress.total"
        ></progress>
        <p v-if="progress.total > 0" class="text-xs opacity-50 mt-1">
          {{ progress.current }} / {{ progress.total }} files
        </p>
      </div>

      <!-- Error State -->
      <div v-if="error" class="alert alert-error mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ error }}</span>
      </div>

      <!-- Actions -->
      <div class="modal-action">
        <button @click="cancel" class="btn btn-ghost" :disabled="isLoading">Cancel</button>
        <button v-if="step !== 'url'" @click="goBack" class="btn btn-ghost" :disabled="isLoading">Back</button>

        <!-- URL Step Action -->
        <button
          v-if="step === 'url'"
          @click="fetchRepoInfo"
          :disabled="!repoUrl.trim() || isLoading"
          class="btn btn-primary"
        >
          <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
          <span v-else>Next</span>
        </button>

        <!-- Branch Step Action -->
        <button
          v-if="step === 'branch'"
          @click="fetchPreview"
          :disabled="!selectedBranch || isLoading"
          class="btn btn-primary"
        >
          <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
          <span v-else>Scan Repository</span>
        </button>

        <!-- Preview Step Action -->
        <button
          v-if="step === 'preview'"
          @click="confirmImport"
          :disabled="isLoading || previewFiles.length === 0"
          class="btn btn-primary"
        >
          <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
          <span v-else>Import {{ previewFiles.length }} files</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useFileSystemStore } from '../stores/fileSystem'
import { useCollaborationStore } from '../stores/collaboration'
import {
  parseGitHubUrl,
  getRepoInfo,
  getBranches,
  getRepoPreview,
  importFromGitHub,
  formatFileSize
} from '../composables/useGitImport'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'import'])

const fsStore = useFileSystemStore()
const collabStore = useCollaborationStore()

// State
const step = ref('url') // 'url' | 'branch' | 'preview'
const repoUrl = ref('')
const urlError = ref('')
const parsedUrl = ref(null)
const repoInfo = ref(null)
const branches = ref([])
const selectedBranch = ref('')
const subPath = ref('')
const previewFiles = ref([])
const importMode = ref('merge')
const isLoading = ref(false)
const loadingMessage = ref('')
const error = ref('')
const progress = ref({ current: 0, total: 0 })

// Computed
const totalSize = computed(() => {
  const bytes = previewFiles.value.reduce((sum, f) => sum + f.size, 0)
  return formatFileSize(bytes)
})

// Reset when dialog opens/closes
watch(() => props.visible, (visible) => {
  if (!visible) {
    reset()
  }
})

function reset() {
  step.value = 'url'
  repoUrl.value = ''
  urlError.value = ''
  parsedUrl.value = null
  repoInfo.value = null
  branches.value = []
  selectedBranch.value = ''
  subPath.value = ''
  previewFiles.value = []
  importMode.value = 'merge'
  isLoading.value = false
  loadingMessage.value = ''
  error.value = ''
  progress.value = { current: 0, total: 0 }
}

function goBack() {
  error.value = ''
  if (step.value === 'preview') {
    step.value = 'branch'
    previewFiles.value = []
  } else if (step.value === 'branch') {
    step.value = 'url'
    repoInfo.value = null
    branches.value = []
    selectedBranch.value = ''
  }
}

async function fetchRepoInfo() {
  urlError.value = ''
  error.value = ''

  // Parse the URL
  const parsed = parseGitHubUrl(repoUrl.value)
  if (!parsed) {
    urlError.value = 'Invalid GitHub URL format'
    return
  }

  parsedUrl.value = parsed
  isLoading.value = true
  loadingMessage.value = 'Fetching repository info...'

  try {
    // Get repo info
    const info = await getRepoInfo(parsed.owner, parsed.repo)
    repoInfo.value = info

    // Get branches
    const branchList = await getBranches(parsed.owner, parsed.repo)
    branches.value = branchList

    // Set default branch
    selectedBranch.value = parsed.branch || info.default_branch

    // Set subpath if provided in URL
    subPath.value = parsed.path || ''

    step.value = 'branch'
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

async function fetchPreview() {
  error.value = ''
  isLoading.value = true
  loadingMessage.value = 'Scanning repository files...'

  try {
    const files = await getRepoPreview(
      parsedUrl.value.owner,
      parsedUrl.value.repo,
      selectedBranch.value,
      subPath.value
    )

    if (files.length === 0) {
      error.value = 'No importable files found in this repository/path. Only text files are supported.'
      return
    }

    // Normalize paths if importing from subdirectory
    if (subPath.value) {
      const prefix = '/' + subPath.value
      previewFiles.value = files.map(f => ({
        ...f,
        path: f.path.startsWith(prefix) ? f.path.slice(prefix.length) || '/' + f.path.split('/').pop() : f.path
      }))
    } else {
      previewFiles.value = files
    }

    step.value = 'preview'
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

async function confirmImport() {
  error.value = ''
  isLoading.value = true
  loadingMessage.value = 'Downloading files...'
  progress.value = { current: 0, total: previewFiles.value.length }

  try {
    // Import files from GitHub
    const importedTree = await importFromGitHub(previewFiles.value, (current, total) => {
      progress.value = { current, total }
    })

    if (importMode.value === 'replace') {
      // Replace entire file tree
      fsStore.fileTree = importedTree
      fsStore.activeFilePath = null
    } else {
      // Merge with existing tree
      mergeFileTree(fsStore.fileTree, importedTree)
    }

    // Auto-detect preview files after import
    fsStore.autoDetectPreviewFiles()

    // Set active file to first available file
    const allFiles = fsStore.getAllFiles()
    if (allFiles.length > 0 && !fsStore.activeFilePath) {
      // Prefer index.html, then README.md, then first file
      const indexFile = allFiles.find(f => f.endsWith('index.html'))
      const readmeFile = allFiles.find(f => f.toLowerCase().includes('readme'))
      fsStore.activeFilePath = indexFile || readmeFile || allFiles[0]
    }

    // Sync with collaborators if in session
    if (collabStore.inCollabSession) {
      collabStore.emitFileTreeSync()
    }

    emit('import', {
      count: previewFiles.value.length,
      mode: importMode.value,
      repo: repoInfo.value.full_name
    })
    cancel()
  } catch (err) {
    error.value = 'Import failed: ' + err.message
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
    progress.value = { current: 0, total: 0 }
  }
}

function mergeFileTree(target, source) {
  if (source.type === 'directory' && source.children) {
    if (!target.children) {
      target.children = {}
    }

    for (const [name, child] of Object.entries(source.children)) {
      if (target.children[name]) {
        if (target.children[name].type === 'directory' && child.type === 'directory') {
          mergeFileTree(target.children[name], child)
        } else {
          target.children[name] = JSON.parse(JSON.stringify(child))
        }
      } else {
        target.children[name] = JSON.parse(JSON.stringify(child))
      }
    }
  }
}

function cancel() {
  emit('close')
  reset()
}
</script>

<template>
  <div v-if="visible" class="modal modal-open">
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-4">Import Project</h3>

      <!-- Source Selection Tabs -->
      <div v-if="!showPreview" class="tabs tabs-boxed mb-4">
        <a
          class="tab"
          :class="{ 'tab-active': source === 'zip' }"
          @click="source = 'zip'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          ZIP File
        </a>
        <a
          class="tab"
          :class="{ 'tab-active': source === 'github' }"
          @click="source = 'github'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub
        </a>
      </div>

      <!-- ZIP Import -->
      <div v-if="source === 'zip' && !showPreview">
        <div class="border-2 border-dashed border-base-300 rounded-lg p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p class="mb-4 text-sm opacity-70">Select a ZIP file to import</p>
          <input ref="fileInput" type="file" accept=".zip" @change="handleZipSelect" class="hidden" />
          <button @click="$refs.fileInput.click()" class="btn btn-primary">Choose ZIP File</button>
        </div>
      </div>

      <!-- GitHub Import -->
      <div v-if="source === 'github' && !showPreview">
        <!-- Step 1: URL Input -->
        <div v-if="githubStep === 'url'">
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

          <div class="text-sm opacity-70 mb-4">
            <p class="mb-2">Supported formats:</p>
            <ul class="list-disc list-inside text-xs opacity-80">
              <li>https://github.com/owner/repo</li>
              <li>owner/repo</li>
              <li>https://github.com/owner/repo/tree/branch/path</li>
            </ul>
          </div>
        </div>

        <!-- Step 2: Branch Selection -->
        <div v-else-if="githubStep === 'branch'">
          <div class="mb-4">
            <div class="flex items-center gap-2 mb-2">
              <span class="font-semibold">{{ repoInfo.full_name }}</span>
              <a :href="repoInfo.html_url" target="_blank" class="btn btn-xs btn-ghost">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
            <p v-if="repoInfo.description" class="text-sm opacity-70">{{ repoInfo.description }}</p>
          </div>

          <div class="form-control mb-4">
            <label class="label"><span class="label-text">Branch</span></label>
            <select v-model="selectedBranch" class="select select-bordered w-full">
              <option v-for="branch in branches" :key="branch" :value="branch">
                {{ branch }} {{ branch === repoInfo.default_branch ? '(default)' : '' }}
              </option>
            </select>
          </div>

          <div class="form-control mb-4">
            <label class="label"><span class="label-text">Subdirectory (optional)</span></label>
            <input v-model="subPath" type="text" placeholder="path/to/folder" class="input input-bordered w-full" />
          </div>
        </div>
      </div>

      <!-- Preview Step (shared for both ZIP and GitHub) -->
      <div v-if="showPreview">
        <div class="flex items-center gap-2 mb-4">
          <span class="badge badge-neutral">{{ source === 'zip' ? 'ZIP File' : repoInfo?.full_name }}</span>
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

        <!-- File Preview with Selection -->
        <div class="bg-base-200 rounded-lg p-4 mb-4">
          <div class="flex justify-between items-center mb-2">
            <span class="font-semibold text-sm">Files to import:</span>
            <span class="text-sm opacity-70">{{ selectedFiles.size }} of {{ previewFiles.length }} selected</span>
          </div>

          <div class="flex gap-2 mb-2">
            <button @click="selectAllFiles" class="btn btn-xs btn-ghost">Select All</button>
            <button @click="deselectAllFiles" class="btn btn-xs btn-ghost">Deselect All</button>
          </div>

          <div class="max-h-64 overflow-y-auto">
            <label
              v-for="file in previewFiles"
              :key="file.path"
              class="flex items-center gap-2 px-2 py-1 text-sm font-mono hover:bg-base-300 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                :checked="selectedFiles.has(file.path)"
                @change="toggleFile(file.path)"
                class="checkbox checkbox-sm checkbox-primary"
              />
              <span class="truncate flex-1">{{ file.path }}</span>
              <span class="text-xs opacity-50 whitespace-nowrap">{{ formatFileSize(file.size) }}</span>
            </label>
          </div>
        </div>

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
        <progress v-if="progress.total > 0" class="progress progress-primary w-64 mt-4" :value="progress.current" :max="progress.total"></progress>
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
        <button v-if="canGoBack" @click="goBack" class="btn btn-ghost" :disabled="isLoading">Back</button>

        <!-- GitHub URL Step -->
        <button v-if="source === 'github' && githubStep === 'url' && !showPreview" @click="fetchRepoInfo" :disabled="!repoUrl.trim() || isLoading" class="btn btn-primary">
          Next
        </button>

        <!-- GitHub Branch Step -->
        <button v-if="source === 'github' && githubStep === 'branch' && !showPreview" @click="fetchGitHubPreview" :disabled="!selectedBranch || isLoading" class="btn btn-primary">
          Scan Repository
        </button>

        <!-- Import Button -->
        <button v-if="showPreview" @click="confirmImport" :disabled="isLoading || selectedFiles.size === 0" class="btn btn-primary">
          <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
          <span v-else>Import {{ selectedFiles.size }} files</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useFileSystemStore } from '../stores/fileSystem'
import { useCollaborationStore } from '../stores/collaboration'
import { getZipPreview, importFilesFromZip } from '../composables/useFileExport'
import {
  parseGitHubUrl,
  getRepoInfo,
  getBranches,
  getRepoPreview,
  importFromGitHub,
  formatFileSize
} from '../composables/useGitImport'

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'import'])

const fsStore = useFileSystemStore()
const collabStore = useCollaborationStore()

// Common state
const source = ref('zip') // 'zip' | 'github'
const previewFiles = ref([])
const selectedFiles = ref(new Set())
const importMode = ref('merge')
const isLoading = ref(false)
const loadingMessage = ref('')
const error = ref('')
const progress = ref({ current: 0, total: 0 })
const showPreview = ref(false)

// ZIP state
const fileInput = ref(null)
const selectedZipFile = ref(null)

// GitHub state
const githubStep = ref('url') // 'url' | 'branch'
const repoUrl = ref('')
const urlError = ref('')
const parsedUrl = ref(null)
const repoInfo = ref(null)
const branches = ref([])
const selectedBranch = ref('')
const subPath = ref('')

// Computed
const canGoBack = computed(() => {
  if (showPreview.value) return true
  if (source.value === 'github' && githubStep.value === 'branch') return true
  return false
})

// Reset when dialog closes
watch(() => props.visible, (visible) => {
  if (!visible) reset()
})

function reset() {
  source.value = 'zip'
  previewFiles.value = []
  selectedFiles.value = new Set()
  importMode.value = 'merge'
  isLoading.value = false
  loadingMessage.value = ''
  error.value = ''
  progress.value = { current: 0, total: 0 }
  showPreview.value = false

  // ZIP
  selectedZipFile.value = null
  if (fileInput.value) fileInput.value.value = ''

  // GitHub
  githubStep.value = 'url'
  repoUrl.value = ''
  urlError.value = ''
  parsedUrl.value = null
  repoInfo.value = null
  branches.value = []
  selectedBranch.value = ''
  subPath.value = ''
}

function goBack() {
  error.value = ''
  if (showPreview.value) {
    showPreview.value = false
    previewFiles.value = []
    selectedFiles.value = new Set()
    if (source.value === 'zip') {
      selectedZipFile.value = null
      if (fileInput.value) fileInput.value.value = ''
    }
  } else if (source.value === 'github' && githubStep.value === 'branch') {
    githubStep.value = 'url'
    repoInfo.value = null
    branches.value = []
  }
}

// ZIP functions
async function handleZipSelect(event) {
  const file = event.target.files[0]
  if (!file) return

  selectedZipFile.value = file
  isLoading.value = true
  loadingMessage.value = 'Reading ZIP file...'
  error.value = ''

  try {
    previewFiles.value = await getZipPreview(file)
    selectedFiles.value = new Set(previewFiles.value.map(f => f.path))
    showPreview.value = true
  } catch (err) {
    error.value = 'Failed to read ZIP: ' + err.message
    selectedZipFile.value = null
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// GitHub functions
async function fetchRepoInfo() {
  urlError.value = ''
  error.value = ''

  const parsed = parseGitHubUrl(repoUrl.value)
  if (!parsed) {
    urlError.value = 'Invalid GitHub URL format'
    return
  }

  parsedUrl.value = parsed
  isLoading.value = true
  loadingMessage.value = 'Fetching repository info...'

  try {
    repoInfo.value = await getRepoInfo(parsed.owner, parsed.repo)
    branches.value = await getBranches(parsed.owner, parsed.repo)
    selectedBranch.value = parsed.branch || repoInfo.value.default_branch
    subPath.value = parsed.path || ''
    githubStep.value = 'branch'
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

async function fetchGitHubPreview() {
  error.value = ''
  isLoading.value = true
  loadingMessage.value = 'Scanning repository...'

  try {
    const files = await getRepoPreview(parsedUrl.value.owner, parsedUrl.value.repo, selectedBranch.value, subPath.value)

    if (files.length === 0) {
      error.value = 'No importable files found. Only text files are supported.'
      return
    }

    // Normalize paths for subdirectory imports
    if (subPath.value) {
      const prefix = '/' + subPath.value
      previewFiles.value = files.map(f => ({
        ...f,
        path: f.path.startsWith(prefix) ? f.path.slice(prefix.length) || '/' + f.path.split('/').pop() : f.path
      }))
    } else {
      previewFiles.value = files
    }

    selectedFiles.value = new Set(previewFiles.value.map(f => f.path))
    showPreview.value = true
  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// File selection
function selectAllFiles() {
  selectedFiles.value = new Set(previewFiles.value.map(f => f.path))
}

function deselectAllFiles() {
  selectedFiles.value = new Set()
}

function toggleFile(path) {
  const newSet = new Set(selectedFiles.value)
  if (newSet.has(path)) newSet.delete(path)
  else newSet.add(path)
  selectedFiles.value = newSet
}

// Import
async function confirmImport() {
  error.value = ''
  isLoading.value = true

  const filesToImport = previewFiles.value.filter(f => selectedFiles.value.has(f.path))
  progress.value = { current: 0, total: filesToImport.length }

  try {
    let importedTree

    if (source.value === 'zip') {
      loadingMessage.value = 'Importing files...'
      importedTree = await importFilesFromZip(selectedZipFile.value)
    } else {
      loadingMessage.value = 'Downloading files...'
      importedTree = await importFromGitHub(filesToImport, (current, total) => {
        progress.value = { current, total }
      })
    }

    if (importMode.value === 'replace') {
      fsStore.fileTree = importedTree
      fsStore.activeFilePath = null
    } else {
      mergeFileTree(fsStore.fileTree, importedTree)
    }

    fsStore.autoDetectPreviewFiles()

    // Set active file
    const allFiles = fsStore.getAllFiles()
    if (allFiles.length > 0 && !fsStore.activeFilePath) {
      const indexFile = allFiles.find(f => f.endsWith('index.html'))
      const readmeFile = allFiles.find(f => f.toLowerCase().includes('readme'))
      fsStore.activeFilePath = indexFile || readmeFile || allFiles[0]
    }

    // Sync with collaborators
    if (collabStore.inCollabSession) {
      collabStore.emitFileTreeSync()
    }

    emit('import', {
      count: filesToImport.length,
      mode: importMode.value,
      source: source.value,
      repo: source.value === 'github' ? repoInfo.value?.full_name : null
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

function mergeFileTree(target, src) {
  if (src.type === 'directory' && src.children) {
    if (!target.children) target.children = {}
    for (const [name, child] of Object.entries(src.children)) {
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

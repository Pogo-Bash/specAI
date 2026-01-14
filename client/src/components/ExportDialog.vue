<template>
  <div v-if="visible" class="modal modal-open">
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-4">Export Project</h3>

      <!-- Destination Selection Tabs -->
      <div class="tabs tabs-boxed mb-4">
        <a
          class="tab"
          :class="{ 'tab-active': destination === 'zip' }"
          @click="destination = 'zip'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-12" />
          </svg>
          ZIP File
        </a>
        <a
          class="tab"
          :class="{ 'tab-active': destination === 'github' }"
          @click="destination = 'github'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub
        </a>
      </div>

      <!-- ZIP Export -->
      <div v-if="destination === 'zip'">
        <!-- Select All / Deselect All -->
        <div class="flex justify-between items-center mb-4 pb-3 border-b border-base-300">
          <div class="flex gap-2">
            <button @click="selectAll" class="btn btn-sm btn-ghost">Select All</button>
            <button @click="deselectAll" class="btn btn-sm btn-ghost">Deselect All</button>
          </div>
          <span class="text-sm opacity-70">{{ selectedFiles.size }} of {{ allFiles.length }} selected</span>
        </div>

        <!-- File List -->
        <div class="max-h-64 overflow-y-auto bg-base-200 rounded-lg p-2">
          <div
            v-for="filePath in allFiles"
            :key="filePath"
            class="flex items-center gap-2 px-2 py-1 hover:bg-base-300 rounded cursor-pointer"
            @click="toggleFile(filePath)"
          >
            <input
              type="checkbox"
              :checked="selectedFiles.has(filePath)"
              class="checkbox checkbox-sm checkbox-primary"
              @click.stop
              @change="toggleFile(filePath)"
            />
            <span class="text-sm font-mono truncate">{{ filePath }}</span>
          </div>
          <div v-if="allFiles.length === 0" class="text-center py-8 text-base-content opacity-50">
            No files to export
          </div>
        </div>

        <!-- Export filename -->
        <div class="form-control mt-4">
          <label class="label"><span class="label-text">Export filename</span></label>
          <input v-model="exportName" type="text" placeholder="my-project" class="input input-bordered w-full" />
          <label class="label"><span class="label-text-alt">Will be exported as {{ exportName }}.zip</span></label>
        </div>
      </div>

      <!-- GitHub Export -->
      <div v-if="destination === 'github'">
        <!-- Step 1: Token -->
        <div v-if="githubStep === 'token'">
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">GitHub Personal Access Token</span>
              <a href="https://github.com/settings/tokens/new?scopes=repo" target="_blank" class="label-text-alt link link-primary">
                Generate token
              </a>
            </label>
            <input
              v-model="githubToken"
              type="password"
              placeholder="ghp_xxxxxxxxxxxx"
              class="input input-bordered w-full"
              :class="{ 'input-error': tokenError }"
            />
            <label v-if="tokenError" class="label">
              <span class="label-text-alt text-error">{{ tokenError }}</span>
            </label>
          </div>

          <div class="form-control mb-4">
            <label class="label cursor-pointer">
              <span class="label-text">Remember token (saved in browser)</span>
              <input type="checkbox" v-model="saveToken" class="checkbox checkbox-primary" />
            </label>
          </div>

          <div class="alert alert-info mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-sm">Your token needs <code class="bg-base-300 px-1 rounded">repo</code> scope to push to repositories.</span>
          </div>
        </div>

        <!-- Step 2: Repository Selection -->
        <div v-else-if="githubStep === 'repo'">
          <div v-if="githubUser" class="flex items-center gap-2 mb-4 p-2 bg-base-200 rounded-lg">
            <img :src="githubUser.avatar_url" class="w-8 h-8 rounded-full" />
            <span class="font-semibold">{{ githubUser.login }}</span>
            <button @click="clearAndReset" class="btn btn-xs btn-ghost ml-auto">Change account</button>
          </div>

          <div class="tabs tabs-bordered mb-4">
            <a class="tab" :class="{ 'tab-active': repoMode === 'existing' }" @click="repoMode = 'existing'">Existing Repo</a>
            <a class="tab" :class="{ 'tab-active': repoMode === 'new' }" @click="repoMode = 'new'">New Repo</a>
          </div>

          <!-- Existing repo -->
          <div v-if="repoMode === 'existing'">
            <div class="form-control mb-4">
              <label class="label"><span class="label-text">Select Repository</span></label>
              <select v-model="selectedRepo" class="select select-bordered w-full">
                <option value="">-- Select a repository --</option>
                <option v-for="repo in userRepos" :key="repo.full_name" :value="repo.full_name">
                  {{ repo.full_name }} {{ repo.private ? '(private)' : '' }}
                </option>
              </select>
            </div>

            <div v-if="selectedRepo" class="form-control mb-4">
              <label class="label"><span class="label-text">Branch</span></label>
              <select v-model="selectedBranch" class="select select-bordered w-full">
                <option v-for="branch in branches" :key="branch.name" :value="branch.name">
                  {{ branch.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- New repo -->
          <div v-if="repoMode === 'new'">
            <div class="form-control mb-4">
              <label class="label"><span class="label-text">Repository Name</span></label>
              <input
                v-model="newRepoName"
                type="text"
                placeholder="my-project"
                class="input input-bordered w-full"
                :class="{ 'input-error': repoError }"
              />
              <label v-if="repoError" class="label">
                <span class="label-text-alt text-error">{{ repoError }}</span>
              </label>
            </div>

            <div class="form-control mb-4">
              <label class="label"><span class="label-text">Description (optional)</span></label>
              <input v-model="newRepoDesc" type="text" placeholder="Project description" class="input input-bordered w-full" />
            </div>

            <div class="form-control mb-4">
              <label class="label cursor-pointer">
                <span class="label-text">Private repository</span>
                <input type="checkbox" v-model="newRepoPrivate" class="checkbox checkbox-primary" />
              </label>
            </div>
          </div>
        </div>

        <!-- Step 3: File Selection & Commit -->
        <div v-else-if="githubStep === 'files'">
          <div class="mb-4 p-2 bg-base-200 rounded-lg">
            <span class="font-semibold">{{ targetRepoName }}</span>
            <span class="text-sm opacity-70 ml-2">branch: {{ selectedBranch }}</span>
          </div>

          <!-- File selection -->
          <div class="flex justify-between items-center mb-2">
            <div class="flex gap-2">
              <button @click="selectAll" class="btn btn-xs btn-ghost">Select All</button>
              <button @click="deselectAll" class="btn btn-xs btn-ghost">Deselect All</button>
            </div>
            <span class="text-sm opacity-70">{{ selectedFiles.size }} files</span>
          </div>

          <div class="max-h-48 overflow-y-auto bg-base-200 rounded-lg p-2 mb-4">
            <div
              v-for="filePath in allFiles"
              :key="filePath"
              class="flex items-center gap-2 px-2 py-1 hover:bg-base-300 rounded cursor-pointer"
              @click="toggleFile(filePath)"
            >
              <input
                type="checkbox"
                :checked="selectedFiles.has(filePath)"
                class="checkbox checkbox-sm checkbox-primary"
                @click.stop
                @change="toggleFile(filePath)"
              />
              <span class="text-sm font-mono truncate">{{ filePath }}</span>
            </div>
          </div>

          <!-- Commit message -->
          <div class="form-control">
            <label class="label"><span class="label-text">Commit message</span></label>
            <input
              v-model="commitMessage"
              type="text"
              placeholder="Update project files"
              class="input input-bordered w-full"
            />
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center py-8">
        <span class="loading loading-spinner loading-lg mb-4"></span>
        <p class="text-sm opacity-70">{{ loadingMessage }}</p>
        <progress v-if="progress.total > 0" class="progress progress-primary w-64 mt-4" :value="progress.current" :max="progress.total"></progress>
      </div>

      <!-- Error State -->
      <div v-if="error" class="alert alert-error mt-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ error }}</span>
      </div>

      <!-- Success State -->
      <div v-if="successResult" class="alert alert-success mt-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <div class="font-semibold">Export successful!</div>
          <a :href="successResult.commitUrl" target="_blank" class="link">View commit</a>
        </div>
      </div>

      <!-- Actions -->
      <div class="modal-action">
        <button @click="cancel" class="btn btn-ghost" :disabled="isLoading">Cancel</button>

        <!-- ZIP Export -->
        <button
          v-if="destination === 'zip'"
          @click="exportToZip"
          :disabled="selectedFiles.size === 0 || isLoading"
          class="btn btn-primary"
        >
          <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
          <span v-else>Export {{ selectedFiles.size }} file{{ selectedFiles.size !== 1 ? 's' : '' }}</span>
        </button>

        <!-- GitHub: Back Button -->
        <button v-if="destination === 'github' && canGoBack && !successResult" @click="goBack" class="btn btn-ghost" :disabled="isLoading">
          Back
        </button>

        <!-- GitHub: Token Step -->
        <button
          v-if="destination === 'github' && githubStep === 'token' && !successResult"
          @click="validateAndContinue"
          :disabled="!githubToken.trim() || isLoading"
          class="btn btn-primary"
        >
          <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
          <span v-else>Continue</span>
        </button>

        <!-- GitHub: Repo Step -->
        <button
          v-if="destination === 'github' && githubStep === 'repo' && !successResult"
          @click="selectRepoAndContinue"
          :disabled="!canContinueFromRepo || isLoading"
          class="btn btn-primary"
        >
          <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
          <span v-else>{{ repoMode === 'new' ? 'Create & Continue' : 'Continue' }}</span>
        </button>

        <!-- GitHub: Files Step -->
        <button
          v-if="destination === 'github' && githubStep === 'files' && !successResult"
          @click="pushToGitHub"
          :disabled="selectedFiles.size === 0 || !commitMessage.trim() || isLoading"
          class="btn btn-primary"
        >
          <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
          <span v-else>Push {{ selectedFiles.size }} file{{ selectedFiles.size !== 1 ? 's' : '' }}</span>
        </button>

        <!-- Close after success -->
        <button v-if="successResult" @click="cancel" class="btn btn-primary">Done</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useFileSystemStore } from '../stores/fileSystem'
import { getAllFilePaths, exportFilesToZip } from '../composables/useFileExport'
import {
  getStoredToken,
  storeToken,
  clearToken,
  validateToken,
  getUserRepos,
  getBranches,
  getDefaultBranch,
  exportToGitHub,
  createRepository
} from '../composables/useGitExport'

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'export'])

const fsStore = useFileSystemStore()

// Common state
const destination = ref('zip') // 'zip' | 'github'
const selectedFiles = ref(new Set())
const isLoading = ref(false)
const loadingMessage = ref('')
const error = ref('')
const progress = ref({ current: 0, total: 0 })

// ZIP state
const exportName = ref('project')

// GitHub state
const githubStep = ref('token') // 'token' | 'repo' | 'files'
const githubToken = ref('')
const tokenError = ref('')
const saveToken = ref(true)
const githubUser = ref(null)

const repoMode = ref('existing') // 'existing' | 'new'
const userRepos = ref([])
const selectedRepo = ref('')
const branches = ref([])
const selectedBranch = ref('')

const newRepoName = ref('')
const newRepoDesc = ref('')
const newRepoPrivate = ref(false)
const repoError = ref('')

const commitMessage = ref('Update project files')
const successResult = ref(null)

// Computed
const allFiles = computed(() => getAllFilePaths(fsStore.fileTree))

const canGoBack = computed(() => {
  if (githubStep.value === 'repo') return true
  if (githubStep.value === 'files') return true
  return false
})

const canContinueFromRepo = computed(() => {
  if (repoMode.value === 'existing') {
    return selectedRepo.value && selectedBranch.value
  } else {
    return newRepoName.value.trim().length > 0
  }
})

const targetRepoName = computed(() => {
  if (repoMode.value === 'existing') {
    return selectedRepo.value
  }
  return `${githubUser.value?.login}/${newRepoName.value}`
})

// Watch for dialog open/close
watch(() => props.visible, (visible) => {
  if (visible) {
    selectAll()
    // Load stored token
    const stored = getStoredToken()
    if (stored) {
      githubToken.value = stored
    }
  } else {
    reset()
  }
})

// Watch for repo selection to fetch branches
watch(selectedRepo, async (repo) => {
  if (repo && destination.value === 'github') {
    const [owner, repoName] = repo.split('/')
    isLoading.value = true
    loadingMessage.value = 'Fetching branches...'
    try {
      branches.value = await getBranches(githubToken.value, owner, repoName)
      const defaultBranch = await getDefaultBranch(githubToken.value, owner, repoName)
      selectedBranch.value = defaultBranch
    } catch (e) {
      error.value = e.message
    } finally {
      isLoading.value = false
      loadingMessage.value = ''
    }
  }
})

function reset() {
  destination.value = 'zip'
  selectedFiles.value = new Set()
  isLoading.value = false
  loadingMessage.value = ''
  error.value = ''
  progress.value = { current: 0, total: 0 }
  exportName.value = 'project'

  // Keep token but reset other GitHub state
  githubStep.value = 'token'
  tokenError.value = ''
  githubUser.value = null
  repoMode.value = 'existing'
  userRepos.value = []
  selectedRepo.value = ''
  branches.value = []
  selectedBranch.value = ''
  newRepoName.value = ''
  newRepoDesc.value = ''
  newRepoPrivate.value = false
  repoError.value = ''
  commitMessage.value = 'Update project files'
  successResult.value = null
}

function selectAll() {
  selectedFiles.value = new Set(allFiles.value)
}

function deselectAll() {
  selectedFiles.value = new Set()
}

function toggleFile(filePath) {
  const newSet = new Set(selectedFiles.value)
  if (newSet.has(filePath)) newSet.delete(filePath)
  else newSet.add(filePath)
  selectedFiles.value = newSet
}

function goBack() {
  error.value = ''
  if (githubStep.value === 'files') {
    githubStep.value = 'repo'
  } else if (githubStep.value === 'repo') {
    githubStep.value = 'token'
    githubUser.value = null
  }
}

function clearAndReset() {
  clearToken()
  githubToken.value = ''
  githubStep.value = 'token'
  githubUser.value = null
}

// ZIP export
async function exportToZip() {
  if (selectedFiles.value.size === 0) return
  isLoading.value = true
  loadingMessage.value = 'Creating ZIP file...'

  try {
    await exportFilesToZip(fsStore.fileTree, selectedFiles.value, exportName.value)
    emit('export', { count: selectedFiles.value.size, name: exportName.value, destination: 'zip' })
    cancel()
  } catch (e) {
    error.value = 'Export failed: ' + e.message
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// GitHub: Validate token
async function validateAndContinue() {
  tokenError.value = ''
  error.value = ''
  isLoading.value = true
  loadingMessage.value = 'Validating token...'

  try {
    githubUser.value = await validateToken(githubToken.value)

    if (saveToken.value) {
      storeToken(githubToken.value)
    }

    // Fetch user repos
    loadingMessage.value = 'Fetching repositories...'
    userRepos.value = await getUserRepos(githubToken.value)

    githubStep.value = 'repo'
  } catch (e) {
    tokenError.value = e.message
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// GitHub: Select/create repo and continue
async function selectRepoAndContinue() {
  error.value = ''
  repoError.value = ''

  if (repoMode.value === 'new') {
    // Create new repo
    isLoading.value = true
    loadingMessage.value = 'Creating repository...'

    try {
      const newRepo = await createRepository(
        githubToken.value,
        newRepoName.value.trim(),
        newRepoDesc.value,
        newRepoPrivate.value
      )

      selectedRepo.value = newRepo.full_name
      selectedBranch.value = newRepo.default_branch

      // Small delay to ensure repo is ready
      await new Promise(resolve => setTimeout(resolve, 1500))

      githubStep.value = 'files'
    } catch (e) {
      repoError.value = e.message
    } finally {
      isLoading.value = false
      loadingMessage.value = ''
    }
  } else {
    // Use existing repo
    githubStep.value = 'files'
  }
}

// GitHub: Push files
async function pushToGitHub() {
  error.value = ''
  isLoading.value = true
  progress.value = { current: 0, total: 0 }

  const [owner, repo] = (repoMode.value === 'new' ? `${githubUser.value.login}/${newRepoName.value}` : selectedRepo.value).split('/')

  // Prepare files
  const files = Array.from(selectedFiles.value).map(path => ({
    path,
    content: fsStore.getFile(path)?.content || ''
  }))

  try {
    const result = await exportToGitHub(
      githubToken.value,
      owner,
      repo,
      selectedBranch.value,
      files,
      commitMessage.value,
      (current, total, stage) => {
        progress.value = { current, total }
        loadingMessage.value = stage
      }
    )

    successResult.value = result
    emit('export', {
      count: files.length,
      destination: 'github',
      repo: `${owner}/${repo}`,
      commitUrl: result.commitUrl
    })
  } catch (e) {
    error.value = 'Push failed: ' + e.message
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

function cancel() {
  emit('close')
}
</script>

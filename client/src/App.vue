<template>
  <div id="app" class="bg-base-300 text-base-content">
    <RouterView />

    <!-- Recovery Modal -->
    <RecoveryModal
      :visible="showRecoveryModal"
      :recovery-data="recoveryData"
      @restore="handleRestore"
      @discard="handleDiscard"
    />

    <!-- Notifications -->
    <div class="toast toast-top toast-end z-50">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="[
          'alert',
          notification.type === 'success' && 'alert-success',
          notification.type === 'error' && 'alert-error',
          notification.type === 'warning' && 'alert-warning',
          notification.type === 'info' && 'alert-info'
        ]"
      >
        <span>{{ notification.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router'
import { computed, onMounted, onUnmounted, watch, ref } from 'vue'
import { useUIStore } from './stores/ui'
import { useProjectStore } from './stores/project'
import { useFileSystemStore } from './stores/fileSystem'
import RecoveryModal from './components/RecoveryModal.vue'
import {
  initRecoveryDB,
  saveRecoveryState,
  loadRecoveryState,
  clearRecoveryState
} from './composables/useRecovery'

const uiStore = useUIStore()
const projectStore = useProjectStore()
const fsStore = useFileSystemStore()

const notifications = computed(() => uiStore.notifications)

// Recovery modal state
const showRecoveryModal = ref(false)
const recoveryData = ref(null)

// Auto-save functionality
let saveInterval = null
let saveTimeout = null

async function saveToRecovery() {
  try {
    await saveRecoveryState({
      workspaceName: projectStore.workspaceName,
      fileTree: JSON.parse(JSON.stringify(fsStore.fileTree)),
      activeFilePath: fsStore.activeFilePath,
      previewHtmlFile: fsStore.previewHtmlFile,
      previewCssFile: fsStore.previewCssFile,
      previewJsFile: fsStore.previewJsFile,
      source: projectStore.workspaceSource
    })
  } catch (error) {
    console.error('Recovery save failed:', error)
  }
}

// Debounced save on file tree changes
watch(
  () => fsStore.fileTree,
  () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    saveTimeout = setTimeout(saveToRecovery, 1000)
  },
  { deep: true }
)

async function handleRestore() {
  if (!recoveryData.value) return

  // Restore file tree
  fsStore.fileTree = JSON.parse(JSON.stringify(recoveryData.value.fileTree))
  fsStore.activeFilePath = recoveryData.value.activeFilePath || '/index.html'

  // Restore preview file selections
  if (recoveryData.value.previewHtmlFile) {
    fsStore.previewHtmlFile = recoveryData.value.previewHtmlFile
  }
  if (recoveryData.value.previewCssFile) {
    fsStore.previewCssFile = recoveryData.value.previewCssFile
  }
  if (recoveryData.value.previewJsFile) {
    fsStore.previewJsFile = recoveryData.value.previewJsFile
  }

  // Restore workspace name and source
  projectStore.setWorkspaceName(recoveryData.value.workspaceName)
  projectStore.setWorkspaceSource(recoveryData.value.source)

  // Sync with editor store for preview
  fsStore.syncWithEditorStore()

  showRecoveryModal.value = false
  recoveryData.value = null
  uiStore.showNotification('Work restored successfully', 'success')
}

async function handleDiscard() {
  await clearRecoveryState()
  showRecoveryModal.value = false
  recoveryData.value = null
}

onMounted(async () => {
  // Initialize recovery database
  await initRecoveryDB()

  // Check for recovery data
  const saved = await loadRecoveryState()
  if (saved && saved.fileTree) {
    recoveryData.value = saved
    showRecoveryModal.value = true
  }

  // Auto-save every 5 seconds
  saveInterval = setInterval(saveToRecovery, 5000)
})

onUnmounted(() => {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  if (saveInterval) {
    clearInterval(saveInterval)
  }
})
</script>

<template>
  <div class="w-64 flex flex-col border-r border-base-300 bg-base-100 flex-shrink-0">
    <!-- Header -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-base-300 bg-base-200">
      <span class="font-semibold text-sm">Files</span>
      <div class="flex gap-1">
        <button
          @click="showNewFileDialog"
          class="btn btn-xs btn-ghost"
          title="New File (Ctrl+N)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
        <button
          @click="showNewFolderDialog"
          class="btn btn-xs btn-ghost"
          title="New Folder"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
        </button>
        <button
          @click="collapseAll"
          class="btn btn-xs btn-ghost"
          title="Collapse All"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Import/Export Buttons -->
    <div class="flex flex-col gap-1 px-2 py-2 border-b border-base-300 bg-base-100">
      <div class="flex gap-1">
        <button
          @click="openImportDialog"
          class="btn btn-xs btn-ghost flex-1"
          title="Import Files from ZIP"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          ZIP
        </button>
        <button
          @click="openExportDialog"
          class="btn btn-xs btn-ghost flex-1"
          title="Export Files to ZIP"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-12" />
          </svg>
          Export
        </button>
      </div>
      <button
        @click="openGitImportDialog"
        class="btn btn-xs btn-ghost w-full"
        title="Import from GitHub Repository"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        Import from GitHub
      </button>
    </div>

    <!-- File Tree -->
    <div class="flex-1 overflow-y-auto overflow-x-hidden py-2">
      <FileTreeItem
        v-for="(child, childName) in fsStore.fileTree.children"
        :key="childName"
        :name="childName"
        :item="child"
        :path="'/' + childName"
        :depth="0"
      />
    </div>

    <!-- New File Dialog -->
    <div v-if="newFileDialogVisible" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">New File</h3>
        <div class="form-control">
          <label class="label">
            <span class="label-text">File name</span>
          </label>
          <input
            ref="newFileInput"
            v-model="newFileName"
            @keyup.enter="createNewFile"
            @keyup.escape="hideNewFileDialog"
            type="text"
            placeholder="example.js"
            class="input input-bordered w-full"
          />
        </div>
        <div class="modal-action">
          <button @click="hideNewFileDialog" class="btn btn-ghost">Cancel</button>
          <button @click="createNewFile" class="btn btn-primary">Create</button>
        </div>
      </div>
    </div>

    <!-- New Folder Dialog -->
    <div v-if="newFolderDialogVisible" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">New Folder</h3>
        <div class="form-control">
          <label class="label">
            <span class="label-text">Folder name</span>
          </label>
          <input
            ref="newFolderInput"
            v-model="newFolderName"
            @keyup.enter="createNewFolder"
            @keyup.escape="hideNewFolderDialog"
            type="text"
            placeholder="components"
            class="input input-bordered w-full"
          />
        </div>
        <div class="modal-action">
          <button @click="hideNewFolderDialog" class="btn btn-ghost">Cancel</button>
          <button @click="createNewFolder" class="btn btn-primary">Create</button>
        </div>
      </div>
    </div>

    <!-- Export Dialog -->
    <ExportDialog
      :visible="exportDialogVisible"
      @close="closeExportDialog"
      @export="handleExport"
    />

    <!-- Import Dialog -->
    <ImportDialog
      :visible="importDialogVisible"
      @close="closeImportDialog"
      @import="handleImport"
    />

    <!-- Git Import Dialog -->
    <GitImportDialog
      :visible="gitImportDialogVisible"
      @close="closeGitImportDialog"
      @import="handleGitImport"
    />
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { useFileSystemStore } from '../stores/fileSystem'
import { useCollaborationStore } from '../stores/collaboration'
import { useUIStore } from '../stores/ui'
import FileTreeItem from './FileTreeItem.vue'
import ExportDialog from './ExportDialog.vue'
import ImportDialog from './ImportDialog.vue'
import GitImportDialog from './GitImportDialog.vue'

const fsStore = useFileSystemStore()
const collabStore = useCollaborationStore()
const uiStore = useUIStore()

// Dialog state
const newFileDialogVisible = ref(false)
const newFolderDialogVisible = ref(false)
const exportDialogVisible = ref(false)
const importDialogVisible = ref(false)
const gitImportDialogVisible = ref(false)
const newFileName = ref('')
const newFolderName = ref('')

// Refs for auto-focus
const newFileInput = ref(null)
const newFolderInput = ref(null)

function showNewFileDialog() {
  newFileDialogVisible.value = true
  newFileName.value = ''
  nextTick(() => {
    newFileInput.value?.focus()
  })
}

function hideNewFileDialog() {
  newFileDialogVisible.value = false
  newFileName.value = ''
}

function createNewFile() {
  if (!newFileName.value.trim()) {
    alert('Please enter a file name')
    return
  }

  try {
    const path = '/' + newFileName.value.trim()
    fsStore.createFile(path, '')
    fsStore.activeFilePath = path

    // Emit collaboration event
    collabStore.emitFileCreated(path, '')

    hideNewFileDialog()
  } catch (error) {
    alert(error.message)
  }
}

function showNewFolderDialog() {
  newFolderDialogVisible.value = true
  newFolderName.value = ''
  nextTick(() => {
    newFolderInput.value?.focus()
  })
}

function hideNewFolderDialog() {
  newFolderDialogVisible.value = false
  newFolderName.value = ''
}

function createNewFolder() {
  if (!newFolderName.value.trim()) {
    alert('Please enter a folder name')
    return
  }

  try {
    const path = '/' + newFolderName.value.trim()
    fsStore.createDirectory(path)

    // Emit collaboration event
    collabStore.emitDirectoryCreated(path)

    hideNewFolderDialog()
  } catch (error) {
    alert(error.message)
  }
}

function collapseAll() {
  fsStore.collapseAll()
}

// Import/Export
function openExportDialog() {
  exportDialogVisible.value = true
}

function closeExportDialog() {
  exportDialogVisible.value = false
}

function handleExport(data) {
  uiStore.showNotification(`Exported ${data.count} files to ${data.name}.zip`, 'success')
}

function openImportDialog() {
  importDialogVisible.value = true
}

function closeImportDialog() {
  importDialogVisible.value = false
}

function handleImport(data) {
  uiStore.showNotification(`Imported ${data.count} files (${data.mode} mode)`, 'success')

  // Sync file tree with collaborators
  collabStore.emitFileTreeSync()
}

// Git Import
function openGitImportDialog() {
  gitImportDialogVisible.value = true
}

function closeGitImportDialog() {
  gitImportDialogVisible.value = false
}

function handleGitImport(data) {
  uiStore.showNotification(`Imported ${data.count} files from ${data.repo}`, 'success')
}

// Keyboard shortcuts
function handleKeyDown(e) {
  // Ctrl+N or Cmd+N for new file
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault()
    showNewFileDialog()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

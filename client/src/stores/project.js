import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProjectStore = defineStore('project', () => {
  // State
  const workspaceName = ref('untitled')
  const workspaceSource = ref(null) // null | { type: 'zip'|'github', name: string }

  // Actions
  function setWorkspaceName(name) {
    workspaceName.value = name || 'untitled'
  }

  function setWorkspaceSource(source) {
    workspaceSource.value = source
  }

  function resetWorkspace() {
    workspaceName.value = 'untitled'
    workspaceSource.value = null
  }

  return {
    workspaceName,
    workspaceSource,
    setWorkspaceName,
    setWorkspaceSource,
    resetWorkspace
  }
})

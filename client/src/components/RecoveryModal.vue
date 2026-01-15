<template>
  <div v-if="visible" class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">Recover Unsaved Work?</h3>

      <div class="space-y-3">
        <p>
          We found unsaved work from <strong>{{ relativeTime }}</strong>.
        </p>

        <p v-if="sourceInfo" class="text-sm opacity-70">
          {{ sourceInfo }}
        </p>

        <div v-if="recoveryData" class="bg-base-200 rounded-lg p-3">
          <div class="flex items-center gap-2 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span class="font-medium">{{ recoveryData.workspaceName || 'untitled' }}</span>
          </div>
          <div class="text-xs opacity-60 mt-1 ml-6">
            {{ fileCount }} file{{ fileCount !== 1 ? 's' : '' }}
          </div>
        </div>
      </div>

      <div class="modal-action">
        <button @click="discard" class="btn btn-ghost">Discard</button>
        <button @click="restore" class="btn btn-primary">Restore</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatRelativeTime } from '../composables/useRecovery'

const props = defineProps({
  visible: { type: Boolean, default: false },
  recoveryData: { type: Object, default: null }
})

const emit = defineEmits(['restore', 'discard'])

const relativeTime = computed(() => {
  if (!props.recoveryData?.timestamp) return 'recently'
  return formatRelativeTime(props.recoveryData.timestamp)
})

const sourceInfo = computed(() => {
  if (!props.recoveryData?.source) return null

  const source = props.recoveryData.source
  if (source.type === 'github') {
    return `From GitHub: ${source.name}`
  } else if (source.type === 'zip') {
    return `From ZIP: ${source.name}`
  }
  return null
})

const fileCount = computed(() => {
  if (!props.recoveryData?.fileTree?.children) return 0
  return countFiles(props.recoveryData.fileTree)
})

function countFiles(node) {
  if (!node) return 0
  if (node.type === 'file') return 1
  if (node.type === 'directory' && node.children) {
    return Object.values(node.children).reduce((sum, child) => sum + countFiles(child), 0)
  }
  return 0
}

function restore() {
  emit('restore')
}

function discard() {
  emit('discard')
}
</script>

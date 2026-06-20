import { defineStore } from 'pinia'
import { getModeLabel } from '@/constants/modes'

const MAX_ITEMS = 100

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useHistoryStore = defineStore('history', {
  state: () => ({
    items: [],
    restoreDraft: null,
  }),
  getters: {
    sortedItems(state) {
      return [...state.items].sort((a, b) => b.createdAt - a.createdAt)
    },
    total(state) {
      return state.items.length
    },
  },
  actions: {
    addRecord({
      mode,
      prompt,
      model,
      resolution,
      ratio,
      duration,
      taskId = '',
      formSnapshot = null,
    }) {
      const record = {
        id: newId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'processing',
        mode,
        modeLabel: getModeLabel(mode),
        prompt: (prompt || '').trim(),
        model,
        resolution,
        ratio,
        duration,
        taskId,
        videoUrl: '',
        tokens: 0,
        errorMessage: '',
        formSnapshot,
      }
      this.items.unshift(record)
      if (this.items.length > MAX_ITEMS) {
        this.items.length = MAX_ITEMS
      }
      return record.id
    },

    updateRecord(id, patch) {
      const item = this.items.find((r) => r.id === id)
      if (!item) return
      Object.assign(item, patch, { updatedAt: Date.now() })
    },

    removeRecord(id) {
      const idx = this.items.findIndex((r) => r.id === id)
      if (idx !== -1) this.items.splice(idx, 1)
    },

    clearAll() {
      this.items = []
    },

    prepareRestore(id) {
      const item = this.items.find((r) => r.id === id)
      if (!item?.formSnapshot) return false
      this.restoreDraft = { ...item.formSnapshot }
      return true
    },

    consumeRestoreDraft() {
      const draft = this.restoreDraft
      this.restoreDraft = null
      return draft
    },
  },
  persist: true,
})
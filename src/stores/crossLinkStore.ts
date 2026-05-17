import { nanoid } from 'nanoid'
import { create } from 'zustand'

import type { FrameworkGraph, FrameworkType } from '@/types'

export interface CrossLinkSlot {
  id: string
  frameworkType: FrameworkType | null
  inputText: string
  graph: FrameworkGraph | null
  isLoading: boolean
}

export interface CrossEdgeData {
  id: string
  sourceNodeId: string
  targetNodeId: string
}

const MAX_SLOTS = 3

function makeSlot(): CrossLinkSlot {
  return {
    id: nanoid(),
    frameworkType: null,
    inputText: '',
    graph: null,
    isLoading: false,
  }
}

export interface CrossLinkStore {
  slots: CrossLinkSlot[]
  crossEdges: CrossEdgeData[]
  connectMode: boolean
  addSlot: () => void
  removeSlot: (slotId: string) => void
  setSlotFramework: (slotId: string, fw: FrameworkType) => void
  setSlotInput: (slotId: string, text: string) => void
  setSlotGraph: (slotId: string, graph: FrameworkGraph | null) => void
  setSlotLoading: (slotId: string, loading: boolean) => void
  addCrossEdge: (edge: CrossEdgeData) => void
  removeCrossEdge: (edgeId: string) => void
  setConnectMode: (v: boolean) => void
  reset: () => void
}

export const useCrossLinkStore = create<CrossLinkStore>((set, get) => ({
  slots: [makeSlot(), makeSlot()],
  crossEdges: [],
  connectMode: false,

  addSlot: () => {
    if (get().slots.length >= MAX_SLOTS) return
    set((state) => ({ slots: [...state.slots, makeSlot()] }))
  },

  removeSlot: (slotId) => {
    set((state) => ({
      slots: state.slots.filter((s) => s.id !== slotId),
      crossEdges: state.crossEdges.filter(
        (e) => !e.sourceNodeId.startsWith(`${slotId}@@`) && !e.targetNodeId.startsWith(`${slotId}@@`),
      ),
    }))
  },

  setSlotFramework: (slotId, fw) => {
    set((state) => ({
      slots: state.slots.map((s) =>
        s.id === slotId ? { ...s, frameworkType: fw, graph: null } : s,
      ),
    }))
  },

  setSlotInput: (slotId, text) => {
    set((state) => ({
      slots: state.slots.map((s) => (s.id === slotId ? { ...s, inputText: text } : s)),
    }))
  },

  setSlotGraph: (slotId, graph) => {
    set((state) => ({
      slots: state.slots.map((s) => (s.id === slotId ? { ...s, graph } : s)),
    }))
  },

  setSlotLoading: (slotId, isLoading) => {
    set((state) => ({
      slots: state.slots.map((s) => (s.id === slotId ? { ...s, isLoading } : s)),
    }))
  },

  addCrossEdge: (edge) => {
    set((state) => ({ crossEdges: [...state.crossEdges, edge] }))
  },

  removeCrossEdge: (edgeId) => {
    set((state) => ({ crossEdges: state.crossEdges.filter((e) => e.id !== edgeId) }))
  },

  setConnectMode: (connectMode) => set({ connectMode }),

  reset: () =>
    set({
      slots: [makeSlot(), makeSlot()],
      crossEdges: [],
      connectMode: false,
    }),
}))

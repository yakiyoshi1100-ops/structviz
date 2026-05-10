import { nanoid } from 'nanoid'
import { create } from 'zustand'

import type { FrameworkGraph, FrameworkType, InputEntry, NodeRole, StructuredNode } from '@/types'

type NodePatch = Partial<Omit<StructuredNode, 'id'>>
type NodePosition = StructuredNode['position']

export interface SessionStore {
  currentInput: string
  inputHistory: InputEntry[]
  activeFramework: FrameworkType | null
  graph: FrameworkGraph | null
  isClassifying: boolean
  lastError: string | null
  setInput: (input: string) => void
  appendInput: (entry: InputEntry) => void
  commitInput: () => InputEntry | null
  setFramework: (framework: FrameworkType | null) => void
  setGraph: (graph: FrameworkGraph | null) => void
  updateNode: (nodeId: string, patch: NodePatch) => void
  moveNode: (nodeId: string, position: NodePosition) => void
  moveToUnclassified: (nodeId: string) => void
  promoteFromUnclassified: (nodeId: string, role?: NodeRole) => void
  setClassifying: (isClassifying: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  currentInput: '',
  inputHistory: [] as InputEntry[],
  activeFramework: null as FrameworkType | null,
  graph: null as FrameworkGraph | null,
  isClassifying: false,
  lastError: null as string | null,
}

const EMPTY_NODES: StructuredNode[] = []

function withUpdatedNode(
  nodes: StructuredNode[],
  nodeId: string,
  updater: (node: StructuredNode) => StructuredNode,
): StructuredNode[] {
  return nodes.map((node) => (node.id === nodeId ? updater(node) : node))
}

function touchGraph(graph: FrameworkGraph): FrameworkGraph {
  return {
    ...graph,
    updatedAt: new Date().toISOString(),
  }
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  ...initialState,
  setInput: (currentInput) => set({ currentInput }),
  appendInput: (entry) =>
    set((state) => ({
      inputHistory: [...state.inputHistory, entry],
    })),
  commitInput: () => {
    const content = get().currentInput.trim()

    if (!content) {
      return null
    }

    const entry: InputEntry = {
      id: nanoid(),
      content,
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      currentInput: '',
      inputHistory: [...state.inputHistory, entry],
    }))

    return entry
  },
  setFramework: (activeFramework) => set({ activeFramework }),
  setGraph: (graph) => set({ graph }),
  updateNode: (nodeId, patch) =>
    set((state) => {
      if (!state.graph) {
        return state
      }

      return {
        graph: touchGraph({
          ...state.graph,
          nodes: withUpdatedNode(state.graph.nodes, nodeId, (node) => ({ ...node, ...patch })),
          unclassified: withUpdatedNode(state.graph.unclassified ?? [], nodeId, (node) => ({
            ...node,
            ...patch,
          })),
        }),
      }
    }),
  moveNode: (nodeId, position) =>
    get().updateNode(nodeId, {
      position,
    }),
  moveToUnclassified: (nodeId) =>
    set((state) => {
      if (!state.graph) {
        return state
      }

      const node = state.graph.nodes.find((item) => item.id === nodeId)

      if (!node) {
        return state
      }

      return {
        graph: touchGraph({
          ...state.graph,
          nodes: state.graph.nodes.filter((item) => item.id !== nodeId),
          unclassified: [...(state.graph.unclassified ?? []), node],
        }),
      }
    }),
  promoteFromUnclassified: (nodeId, role) =>
    set((state) => {
      if (!state.graph) {
        return state
      }

      const unclassified = state.graph.unclassified ?? []
      const node = unclassified.find((item) => item.id === nodeId)

      if (!node) {
        return state
      }

      return {
        graph: touchGraph({
          ...state.graph,
          nodes: [
            ...state.graph.nodes,
            {
              ...node,
              role: role ?? node.role,
            },
          ],
          unclassified: unclassified.filter((item) => item.id !== nodeId),
        }),
      }
    }),
  setClassifying: (isClassifying) => set({ isClassifying }),
  setError: (lastError) => set({ lastError }),
  reset: () => set({ ...initialState }),
}))

export const selectActiveNodes = (state: SessionStore): StructuredNode[] =>
  state.graph?.nodes ?? EMPTY_NODES

export const selectUnclassified = (state: SessionStore): StructuredNode[] =>
  state.graph?.unclassified ?? EMPTY_NODES

export const selectIsReady = (state: SessionStore): boolean =>
  state.activeFramework !== null && !state.isClassifying

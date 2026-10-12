# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server (Vite, hot-reload)
npm run build      # tsc -b && vite build (type-check + bundle)
npm run lint       # ESLint across all source files
npm run preview    # serve the production build locally
```

No test runner is configured. Validation is done via TypeScript and ESLint at build time.

## Path Alias

`@/` maps to `src/`. Use this everywhere instead of relative paths deeper than one level.

## Architecture Overview

StructViz is a browser-only React + TypeScript + Vite app that takes free-form text and visualises it as a structured business-framework diagram. All state is ephemeral (no backend, no database); config is persisted to `localStorage`.

### Modes

The app boots into `ModeSelectPage`, which sets `AppConfig.mode`:

- **`standalone`** — keyword/rule-based classification via `StandaloneStrategy`. No API key needed.
- **`ai`** — calls the Anthropic Claude API directly from the browser (`claude-sonnet-4-6`) via `AIStrategy`. Requires an API key stored in `configStore`.

`strategyFactory.ts` selects the right strategy at classification time.

### State (Zustand)

| Store | Purpose |
|---|---|
| `configStore` | App config (mode, API keys, view mode). Persisted to `localStorage` under `structviz-config`. |
| `sessionStore` | Current session: input text, active framework, and the live `FrameworkGraph`. Not persisted. |
| `uiStore` | Transient UI flags (panel open/closed, etc.). |

The core data model (`src/types/graph.ts`) is `FrameworkGraph`, which contains `StructuredNode[]`, `StructuredEdge[]`, and an optional `unclassified` node list.

### Classification Pipeline

1. User selects a `FrameworkType` from the sidebar and types text into `InputPanel`.
2. `useClassification` hook calls `strategy.classify(text, frameworkType, { previousGraph })`.
3. **Standalone**: `tokenizer.ts` splits text into sentences → `ruleEngine.ts` applies `FrameworkRuleSet` keyword rules → builds a `FrameworkGraph`.
4. **AI**: sends a system prompt (built from `SYSTEM_PROMPTS[frameworkType]`) plus user text to Claude via `claudeClient.ts`. Response is validated with `responseValidator.ts` (AJV JSON Schema) and normalised into a `FrameworkGraph`.
5. Result is stored in `sessionStore.graph`.

### Canvas Rendering

`CanvasRouter` (`src/components/organisms/canvas/CanvasRouter.tsx`) dispatches each `FrameworkType` to the appropriate canvas component:

- **ReactFlow-based** (self-managing zoom/pan): `TreeCanvas`, `WBSCanvas`, `FishboneCanvas`, `KPICanvas`, `PhenomenonToActionCanvas`, `LogicCanvas`.
- **CSS-layout + `ZoomPanCanvas` wrapper**: `MatrixCanvas`, `MeceCanvas`, `PyramidCanvas`, `ThreeCCanvas`, `PESTCanvas`, `AsIsToBeCanvas`, `BusinessFlowCanvas`, `CustomerJourneyCanvas`.
- Matrix frameworks share `MatrixCanvas`; tree-type frameworks that don't have a dedicated canvas fall through to `TreeCanvas`.

### Frameworks

33 business frameworks are defined in `FRAMEWORK_REGISTRY` (`src/types/framework.ts`). Each entry specifies visualization type (`tree` | `matrix`), allowed `NodeRole`s, and display metadata. To add a new framework:

1. Add a `FrameworkType` constant and entry to `FRAMEWORK_REGISTRY`.
2. Add `NodeRole` values to the union in `src/types/graph.ts`.
3. Add a rule set in `src/classification/rules/` and register it in `src/classification/rules/index.ts`.
4. Add a system prompt entry in `src/llm/prompts/system/index.ts`.
5. Wire it to an existing canvas in `CanvasRouter`, or create a new canvas component.

### Cross-link Feature

`useAICrossLink` + `useCrossLinkClassify` enable AI-suggested edges between nodes of different frameworks. The prompt is in `src/llm/prompts/crossLinkPrompt.ts`.

### Exports

`src/exporters/` provides PNG (`html2canvas`), JSON, and Markdown export. Accessible via `useExport` hook and `ExportMenu` component.

### LLM Client

`claudeClient.ts` calls the Anthropic API directly from the browser using the `anthropic-dangerous-direct-browser-access: true` header. JSON responses are auto-repaired (`repairJSON`) and retried up to 2 times on parse failure. Speech-to-text uses either OpenAI Whisper (proxied via Vite's `/openai-api` proxy) or a local Whisper endpoint.

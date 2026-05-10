import React, { useEffect, useState } from 'react'

import { ModeSelectPage, WorkspacePage } from '@/components/pages'
import { useConfigStore } from '@/stores'

import './App.css'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return <pre style={{ color: 'red', padding: 20 }}>{String(this.state.error)}</pre>
    }

    return this.props.children
  }
}

function App() {
  const hydrate = useConfigStore((state) => state.hydrate)
  const hasConfigured = useConfigStore((state) => state.hasConfigured)
  const [sessionStarted, setSessionStarted] = useState(false)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  if (!hasConfigured && !sessionStarted) {
    return <ModeSelectPage onComplete={() => setSessionStarted(true)} />
  }

  return (
    <ErrorBoundary>
      <WorkspacePage />
    </ErrorBoundary>
  )
}

export default App

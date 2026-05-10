import { Toast } from '@/components/atoms'
import { useSessionStore } from '@/stores'

export function ToastContainer() {
  const lastError = useSessionStore((state) => state.lastError)
  const setError = useSessionStore((state) => state.setError)

  if (!lastError) {
    return null
  }

  return <Toast message={lastError} type="error" onClose={() => setError(null)} />
}

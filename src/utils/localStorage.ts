export function getItem<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.localStorage.getItem(key)

  if (rawValue === null) {
    return null
  }

  try {
    return JSON.parse(rawValue) as T
  } catch {
    return null
  }
}

export function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

export function removeItem(key: string): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(key)
}

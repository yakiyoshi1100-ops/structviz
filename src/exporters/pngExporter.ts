import { toBlob } from 'html-to-image'

const HTML_TO_IMAGE_OPTS = {
  pixelRatio: 2,
  backgroundColor: '#ffffff',
  skipAutoScale: false,
} as const

export async function exportPng(canvasEl: HTMLElement, filename: string): Promise<void> {
  const blob = await toBlob(canvasEl, HTML_TO_IMAGE_OPTS)
  if (!blob) throw new Error('PNG Blob の生成に失敗しました')
  downloadBlob(blob, `${filename}.png`)
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

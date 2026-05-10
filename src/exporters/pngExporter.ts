import html2canvas from 'html2canvas'

export async function exportPng(canvasEl: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(canvasEl, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
  })

  canvas.toBlob((blob) => {
    if (!blob) {
      return
    }

    downloadBlob(blob, `${filename}.png`)
  }, 'image/png')
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

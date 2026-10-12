import { toSvg } from 'html-to-image'

import { downloadBlob } from './pngExporter'

export async function exportSvg(canvasEl: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await toSvg(canvasEl, { backgroundColor: '#ffffff' })
  const svgText = decodeURIComponent(dataUrl.slice(dataUrl.indexOf(',') + 1))
  downloadBlob(new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' }), `${filename}.svg`)
}

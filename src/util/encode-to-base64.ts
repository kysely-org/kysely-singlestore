declare const window: any

const IS_BROWSER = typeof window !== 'undefined' && typeof window.document !== 'undefined'

export function encodeToBase64(str: string): string {
  return IS_BROWSER ? btoa(str) : Buffer.from(str).toString('base64')
}

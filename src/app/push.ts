import { api } from './api'

export type PushState = 'unsupported' | 'needs-install' | 'default' | 'granted' | 'denied'

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

export function pushState(): PushState {
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  // iPhones only allow notifications once the app has been added to the Home Screen.
  if (isIos() && !isStandalone()) return 'needs-install'
  if (!supported) return 'unsupported'
  return Notification.permission === 'default' ? 'default' : Notification.permission
}

export const iosNeedsInstall = () => isIos() && !isStandalone()

function keyBytes(base64url: string) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((base64url.length + 3) % 4)
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
}

export async function registerWorker() {
  if (!('serviceWorker' in navigator)) return null
  try { return await navigator.serviceWorker.register('/app/sw.js', { scope: '/app/' }) } catch { return null }
}

/** Asks permission, subscribes this device and tells the backend. Returns the resulting permission. */
export async function enablePush(vapidPublicKey: string): Promise<PushState> {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'default'
  const registration = await registerWorker() ?? await navigator.serviceWorker.ready
  await navigator.serviceWorker.ready
  const existing = await registration.pushManager.getSubscription()
  const subscription = existing ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(vapidPublicKey) })
  await api('push/subscribe', { body: { subscription: subscription.toJSON() } })
  return 'granted'
}

/** Keeps the backend's copy of this device's subscription fresh (it can change between visits). */
export async function refreshPush() {
  if (pushState() !== 'granted') return
  const registration = await navigator.serviceWorker.getRegistration('/app/')
  const subscription = await registration?.pushManager.getSubscription()
  if (subscription) await api('push/subscribe', { body: { subscription: subscription.toJSON() } }).catch(() => {})
}

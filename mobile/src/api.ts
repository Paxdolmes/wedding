import Constants from 'expo-constants'
import { fetch as expoFetch } from 'expo/fetch'
import { Platform } from 'react-native'
import { storage } from './storage'

/** The backend is the same Cloudflare Worker that serves imogenanddan.com. Override with `extra.apiBase` in app.json. */
export const API_BASE: string = Platform.OS === 'web' && typeof location !== 'undefined' && location.port
  ? '' : (Constants.expoConfig?.extra as { apiBase?: string } | undefined)?.apiBase ?? 'https://imogenanddan.com'

export type Role = 'host' | 'helper' | 'dj'
export type StaffSession = { token: string; role: Role; label: string }

let guestToken: string | null = null
let staff: StaffSession | null = null

export const session = {
  async load() {
    guestToken = await storage.get('iad-guest')
    const raw = await storage.get('iad-staff')
    try { staff = raw ? JSON.parse(raw) : null } catch { staff = null }
  },
  get guestToken() { return guestToken },
  async setGuestToken(token: string | null) { guestToken = token; await storage.set('iad-guest', token) },
  get staff() { return staff },
  async setStaff(value: StaffSession | null) { staff = value; await storage.set('iad-staff', value ? JSON.stringify(value) : null) },
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

function headers(extra: Record<string, string> = {}) {
  const h: Record<string, string> = { Accept: 'application/json', ...extra }
  if (guestToken) h.Authorization = `Bearer ${guestToken}`
  if (staff) h['X-Staff-Token'] = staff.token
  return h
}

async function handle<T>(path: string, response: { ok: boolean; status: number; json: () => Promise<unknown> }): Promise<T> {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401 && path.startsWith('staff/') && path !== 'staff/login') await session.setStaff(null)
    throw new ApiError(response.status, (data as { error?: string }).error ?? 'Something went wrong.')
  }
  return data as T
}

export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/api/${path}`, {
      method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
      headers: headers(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'You seem to be offline. Try again when you have signal.')
  }
  return handle<T>(path, response)
}

/** Sends a developed photo as raw JPEG bytes. */
export async function uploadPhoto(bytes: Uint8Array): Promise<{ shotsUsed: number; shots: number }> {
  try {
    const response = await expoFetch(`${API_BASE}/api/photos`, { method: 'POST', headers: headers({ 'Content-Type': 'image/jpeg' }), body: new Uint8Array(bytes).buffer })
    return handle('photos', response)
  } catch (e) {
    if (e instanceof ApiError) throw e
    throw new ApiError(0, 'That shot couldn’t be sent. Check your signal and try again.')
  }
}

export const photoUrl = (id: string) => `${API_BASE}/api/photos/${id}${staff?.role === 'host' ? `?s=${staff.token}` : ''}`

export type Config = { vapidPublicKey: string; joinCodeRequired: boolean; seatingRevealed: boolean; galleryRevealAt: string; shots: number; predictionsLocked: boolean; songsOpen: boolean }
export type Me = { id: string; name: string; linked: boolean; personName: string | null; shotsUsed: number; shots: number }
export type InboxItem = { id: number; title: string; body: string; url: string; sent_by: string; send_at: number }
export type Song = { id: number; title: string; artist: string; played: boolean; votes: number; requestedBy: string; voted: boolean }
export type SongRef = { id: number; title: string; artist: string }
export type Match = { id: number; round: number; slot: number; a?: SongRef; b?: SongRef; aVotes: number; bVotes: number; winner: number | null; myPick: number | null }
export type Battle = { status: 'idle' | 'voting' | 'done'; round: number; rounds: number; matches: Match[]; champion: SongRef | null }
export type Prediction = { id: number; question: string; kind: 'choice' | 'number'; options: string[]; answer: string | null; points: number; mine: string | null; entries: number }
export type Predictions = { locked: boolean; questions: Prediction[]; leaderboard: { name: string; points: number; me: boolean }[]; myPoints: number }
export type SeatCard = { id: number; name: string; seat: number; intro: string }
export type Seat = { revealed: boolean; linked: boolean; name?: string; table?: string | null; seat?: number; neighbours?: SeatCard[]; tablemates?: { id: number; name: string; seat: number; me: boolean }[] }
export type Gallery = { revealed: boolean; revealAt: string; total: number; mine?: number; photos?: { id: string; takenAt: number; by: string; mine: boolean }[] }

/** Talks to the weekend's backend. The guest token and any host/helper/DJ token live in this browser only. */

const GUEST_KEY = 'iad-guest'
const STAFF_KEY = 'iad-staff'

const read = (key: string) => { try { return localStorage.getItem(key) } catch { return null } }
const write = (key: string, value: string | null) => { try { if (value == null) localStorage.removeItem(key); else localStorage.setItem(key, value) } catch { /* private mode */ } }

export type Role = 'host' | 'helper' | 'dj'
export type StaffSession = { token: string; role: Role; label: string }

export const session = {
  get guestToken() { return read(GUEST_KEY) },
  set guestToken(token: string | null) { write(GUEST_KEY, token) },
  get staff(): StaffSession | null { const raw = read(STAFF_KEY); try { return raw ? JSON.parse(raw) : null } catch { return null } },
  set staff(value: StaffSession | null) { write(STAFF_KEY, value ? JSON.stringify(value) : null) },
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

export async function api<T>(path: string, options: { method?: string; body?: unknown; raw?: Blob } = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (session.guestToken) headers.Authorization = `Bearer ${session.guestToken}`
  if (session.staff) headers['X-Staff-Token'] = session.staff.token
  let body: BodyInit | undefined
  if (options.raw) { body = options.raw; headers['Content-Type'] = options.raw.type }
  else if (options.body !== undefined) { body = JSON.stringify(options.body); headers['Content-Type'] = 'application/json' }
  let response: Response
  try {
    response = await fetch(`/api/${path}`, { method: options.method ?? (body ? 'POST' : 'GET'), headers, body })
  } catch {
    throw new ApiError(0, 'You seem to be offline. Try again when you have signal.')
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401 && path.startsWith('staff/') && path !== 'staff/login') session.staff = null
    throw new ApiError(response.status, (data as { error?: string }).error ?? 'Something went wrong.')
  }
  return data as T
}

export const photoUrl = (id: string) => `/api/photos/${id}${session.staff?.role === 'host' ? `?s=${session.staff.token}` : ''}`

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

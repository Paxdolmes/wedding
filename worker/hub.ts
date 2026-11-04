import { DurableObject } from 'cloudflare:workers'
import { generateVapidKeys, sendPush, type VapidKeys } from './push'

export interface Env {
  ASSETS: Fetcher
  HUB: DurableObjectNamespace<WeddingHub>
  /** The couple's passcode for the host screen. Set it as a secret in Cloudflare. */
  HOST_PASSCODE?: string
}

type Role = 'host' | 'helper' | 'dj'
type Staff = { role: Role; label: string }
type Guest = { id: string; name: string; person_id: number | null; shots_used: number }
type Person = { id: number; name: string; table_name: string; seat: number; intro: string; groups: string }
type Note = { title: string; body: string; url: string }
type Outcome = 'ok' | 'failed' | 'gone'
type QueueItem = { id: number; notification_id: number; endpoint: string; kind: string | null; p256dh: string | null; auth: string | null }
type Audience = { kind: 'all' } | { kind: 'tables' | 'groups'; values: string[] }

const SETTINGS_DEFAULTS: Record<string, string> = {
  seating_revealed: '0',
  // 9am the morning after, UK summer time.
  gallery_reveal_at: '2028-08-25T08:00:00.000Z',
  shots: '20',
  predictions_locked: '0',
  join_code: '',
  songs_open: '1',
  battle_round: '0',
  battle_status: 'idle',
}

const SEED_PREDICTIONS: { question: string; kind: 'choice' | 'number'; options: string[] }[] = [
  { question: 'Who cries first?', kind: 'choice', options: ['Dan', 'Imogen', 'A parent', 'The best man'] },
  { question: 'How long will the speeches last, in minutes?', kind: 'number', options: [] },
  { question: 'How many minutes late will the bride be?', kind: 'number', options: [] },
  { question: 'Who will be last on the dancefloor?', kind: 'choice', options: ['Dan', 'Imogen', 'The best man', 'The maid of honour', 'Someone’s uncle'] },
  { question: 'Will Dan get through his vows without his voice wobbling?', kind: 'choice', options: ['Yes, steady as a rock', 'No chance'] },
]

// Web pushes cost one request each; Expo takes 100 a request. Keep each alarm well inside Cloudflare's per-invocation limits.
const PUSH_BATCH = 40
const MAX_PHOTO_BYTES = 1_800_000

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
const clean = (value: unknown, max: number) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
const normalise = (name: string) => name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
const randomToken = () => crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
const splitGroups = (groups: string) => groups.split(',').map(group => group.trim()).filter(Boolean)

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** One Durable Object holds the whole weekend: guests, push subscriptions, photos, songs and games, in its own SQLite. */
export class WeddingHub extends DurableObject<Env> {
  sql: SqlStorage

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    this.sql = ctx.storage.sql
    ctx.blockConcurrencyWhile(async () => this.migrate())
  }

  migrate() {
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS people (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, table_name TEXT NOT NULL DEFAULT '', seat INTEGER NOT NULL DEFAULT 0, intro TEXT NOT NULL DEFAULT '', groups TEXT NOT NULL DEFAULT '');
      CREATE TABLE IF NOT EXISTS guests (id TEXT PRIMARY KEY, token TEXT NOT NULL UNIQUE, name TEXT NOT NULL, person_id INTEGER, shots_used INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS subscriptions (endpoint TEXT PRIMARY KEY, guest_id TEXT NOT NULL, kind TEXT NOT NULL DEFAULT 'web', p256dh TEXT NOT NULL DEFAULT '', auth TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, body TEXT NOT NULL, url TEXT NOT NULL DEFAULT '', audience TEXT NOT NULL, sent_by TEXT NOT NULL, send_at INTEGER NOT NULL, status TEXT NOT NULL, delivered INTEGER NOT NULL DEFAULT 0, failed INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS push_queue (id INTEGER PRIMARY KEY AUTOINCREMENT, notification_id INTEGER NOT NULL, endpoint TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS photos (id TEXT PRIMARY KEY, guest_id TEXT NOT NULL, data BLOB NOT NULL, taken_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS songs (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, artist TEXT NOT NULL, guest_id TEXT NOT NULL, created_at INTEGER NOT NULL, played INTEGER NOT NULL DEFAULT 0, hidden INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS song_votes (song_id INTEGER NOT NULL, guest_id TEXT NOT NULL, PRIMARY KEY (song_id, guest_id));
      CREATE TABLE IF NOT EXISTS battle_matches (id INTEGER PRIMARY KEY AUTOINCREMENT, round INTEGER NOT NULL, slot INTEGER NOT NULL, a INTEGER NOT NULL, b INTEGER NOT NULL, winner INTEGER);
      CREATE TABLE IF NOT EXISTS battle_votes (match_id INTEGER NOT NULL, guest_id TEXT NOT NULL, pick INTEGER NOT NULL, PRIMARY KEY (match_id, guest_id));
      CREATE TABLE IF NOT EXISTS predictions (id INTEGER PRIMARY KEY AUTOINCREMENT, question TEXT NOT NULL, kind TEXT NOT NULL, options TEXT NOT NULL DEFAULT '[]', answer TEXT, points INTEGER NOT NULL DEFAULT 10, sort INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS prediction_answers (prediction_id INTEGER NOT NULL, guest_id TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY (prediction_id, guest_id));
      CREATE TABLE IF NOT EXISTS staff_codes (code TEXT PRIMARY KEY, role TEXT NOT NULL, label TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS staff_sessions (token TEXT PRIMARY KEY, role TEXT NOT NULL, label TEXT NOT NULL, code TEXT, created_at INTEGER NOT NULL);
    `)
    if (this.setting('seeded') !== '1') {
      SEED_PREDICTIONS.forEach((p, index) => this.sql.exec('INSERT INTO predictions (question, kind, options, sort) VALUES (?, ?, ?, ?)', p.question, p.kind, JSON.stringify(p.options), index))
      this.setSetting('seeded', '1')
    }
  }

  setting(key: string): string {
    const row = this.sql.exec<{ value: string }>('SELECT value FROM settings WHERE key = ?', key).toArray()[0]
    return row?.value ?? SETTINGS_DEFAULTS[key] ?? ''
  }

  setSetting(key: string, value: string) {
    this.sql.exec('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, value)
  }

  async vapid(): Promise<VapidKeys> {
    const stored = this.setting('vapid')
    if (stored) return JSON.parse(stored)
    const keys = await generateVapidKeys()
    this.setSetting('vapid', JSON.stringify(keys))
    return keys
  }

  // ---------- identity ----------

  guestFrom(request: Request): Guest | null {
    const header = request.headers.get('Authorization') ?? ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : new URL(request.url).searchParams.get('t') ?? ''
    if (!token) return null
    return this.sql.exec<Guest>('SELECT id, name, person_id, shots_used FROM guests WHERE token = ?', token).toArray()[0] ?? null
  }

  requireGuest(request: Request): Guest {
    const guest = this.guestFrom(request)
    if (!guest) throw new HttpError(401, 'Please join the app first.')
    return guest
  }

  staffFrom(request: Request): Staff | null {
    const token = request.headers.get('X-Staff-Token') ?? new URL(request.url).searchParams.get('s') ?? ''
    if (!token) return null
    return this.sql.exec<Staff>('SELECT role, label FROM staff_sessions WHERE token = ?', token).toArray()[0] ?? null
  }

  requireStaff(request: Request, ...roles: Role[]): Staff {
    const staff = this.staffFrom(request)
    if (!staff) throw new HttpError(401, 'Please sign in to the host screen.')
    if (staff.role !== 'host' && !roles.includes(staff.role)) throw new HttpError(403, 'Only the couple can do that.')
    return staff
  }

  person(id: number | null): Person | null {
    if (id == null) return null
    return this.sql.exec<Person>('SELECT * FROM people WHERE id = ?', id).toArray()[0] ?? null
  }

  // ---------- routing ----------

  async fetch(request: Request): Promise<Response> {
    try {
      return await this.route(request)
    } catch (error) {
      if (error instanceof HttpError) return json({ error: error.message }, error.status)
      console.error(error)
      return json({ error: 'Something went wrong. Please try again.' }, 500)
    }
  }

  async route(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean)
    const method = request.method
    const body = async () => { try { return await request.json() as Record<string, unknown> } catch { return {} } }
    const at = (...pattern: string[]) => pattern.length === parts.length && pattern.every((p, i) => p === '*' || p === parts[i])

    if (method === 'GET' && at('config')) return json(await this.config())
    if (method === 'POST' && at('join')) return json(this.join(await body()))
    if (method === 'GET' && at('me')) return json(this.me(this.requireGuest(request)))
    if (method === 'POST' && at('me', 'link')) return json(this.link(this.requireGuest(request), await body()))
    if (method === 'GET' && at('people')) { this.requireGuest(request); return json(this.searchPeople(url.searchParams.get('q') ?? '')) }

    if (method === 'POST' && at('push', 'subscribe')) return json(this.subscribe(this.requireGuest(request), await body()))
    if (method === 'POST' && at('push', 'expo')) return json(this.subscribeExpo(this.requireGuest(request), await body()))
    if (method === 'POST' && at('push', 'unsubscribe')) { this.sql.exec('DELETE FROM subscriptions WHERE endpoint = ?', clean((await body()).endpoint, 2000)); return json({ ok: true }) }
    if (method === 'GET' && at('inbox')) return json(this.inbox(this.requireGuest(request)))

    if (method === 'GET' && at('seat')) return json(this.seat(this.requireGuest(request), this.staffFrom(request)))

    if (method === 'POST' && at('photos')) return json(await this.takePhoto(this.requireGuest(request), request))
    if (method === 'GET' && at('photos')) return json(this.gallery(this.guestFrom(request), this.staffFrom(request)))
    if (method === 'GET' && at('photos', '*')) return this.photo(parts[1], this.staffFrom(request))

    if (method === 'GET' && at('songs')) return json(this.songs(this.guestFrom(request)))
    if (method === 'POST' && at('songs')) return json(this.requestSong(this.requireGuest(request), await body()))
    if (method === 'POST' && at('songs', '*', 'vote')) return json(this.voteSong(this.requireGuest(request), Number(parts[1])))

    if (method === 'GET' && at('battle')) return json(this.battle(this.guestFrom(request)))
    if (method === 'POST' && at('battle', 'vote')) return json(this.voteBattle(this.requireGuest(request), await body()))

    if (method === 'GET' && at('predictions')) return json(this.predictions(this.guestFrom(request)))
    if (method === 'POST' && at('predictions', '*', 'answer')) return json(this.answerPrediction(this.requireGuest(request), Number(parts[1]), await body()))

    if (parts[0] === 'staff') return this.staffRoute(request, method, parts.slice(1), body)
    throw new HttpError(404, 'Not found')
  }

  async staffRoute(request: Request, method: string, parts: string[], body: () => Promise<Record<string, unknown>>): Promise<Response> {
    const at = (...pattern: string[]) => pattern.length === parts.length && pattern.every((p, i) => p === '*' || p === parts[i])

    if (method === 'POST' && at('login')) return json(this.staffLogin(await body()))
    if (method === 'GET' && at('me')) return json(this.requireStaff(request, 'helper', 'dj'))
    if (method === 'POST' && at('logout')) { this.sql.exec('DELETE FROM staff_sessions WHERE token = ?', request.headers.get('X-Staff-Token') ?? ''); return json({ ok: true }) }

    if (method === 'GET' && at('overview')) { this.requireStaff(request, 'helper', 'dj'); return json(this.overview()) }
    if (method === 'GET' && at('notifications')) { this.requireStaff(request, 'helper'); return json(this.sentNotifications()) }
    if (method === 'POST' && at('notifications')) return json(await this.notify(this.requireStaff(request, 'helper'), await body()))
    if (method === 'DELETE' && at('notifications', '*')) { this.requireStaff(request, 'helper'); this.sql.exec("DELETE FROM notifications WHERE id = ? AND status = 'scheduled'", Number(parts[1])); return json({ ok: true }) }

    if (method === 'PATCH' && at('songs', '*')) { this.requireStaff(request, 'dj'); return json(this.updateSong(Number(parts[1]), await body())) }

    this.requireStaff(request)
    if (method === 'GET' && at('people')) return json(this.sql.exec('SELECT * FROM people ORDER BY table_name, seat, name').toArray())
    if (method === 'PUT' && at('people')) return json(this.replacePeople(await body()))
    if (method === 'GET' && at('settings')) return json(Object.fromEntries(Object.keys(SETTINGS_DEFAULTS).map(key => [key, this.setting(key)])))
    if (method === 'PATCH' && at('settings')) return json(this.updateSettings(await body()))
    if (method === 'GET' && at('codes')) return json(this.sql.exec('SELECT * FROM staff_codes ORDER BY role, label').toArray())
    if (method === 'POST' && at('codes')) return json(this.createCode(await body()))
    if (method === 'DELETE' && at('codes', '*')) { this.sql.exec('DELETE FROM staff_codes WHERE code = ?', parts[1]); this.sql.exec('DELETE FROM staff_sessions WHERE code = ?', parts[1]); return json({ ok: true }) }
    if (method === 'DELETE' && at('photos', '*')) { this.sql.exec('DELETE FROM photos WHERE id = ?', parts[1]); return json({ ok: true }) }
    if (method === 'POST' && at('battle', 'start')) return json(this.startBattle(await body()))
    if (method === 'POST' && at('battle', 'advance')) return json(this.advanceBattle())
    if (method === 'POST' && at('battle', 'reset')) return json(this.resetBattle())
    if (method === 'POST' && at('predictions')) return json(this.savePrediction(null, await body()))
    if (method === 'PATCH' && at('predictions', '*')) return json(this.savePrediction(Number(parts[1]), await body()))
    if (method === 'DELETE' && at('predictions', '*')) { const id = Number(parts[1]); this.sql.exec('DELETE FROM predictions WHERE id = ?', id); this.sql.exec('DELETE FROM prediction_answers WHERE prediction_id = ?', id); return json({ ok: true }) }
    throw new HttpError(404, 'Not found')
  }

  // ---------- guests ----------

  async config() {
    return {
      vapidPublicKey: (await this.vapid()).publicKey,
      joinCodeRequired: this.setting('join_code') !== '',
      seatingRevealed: this.setting('seating_revealed') === '1',
      galleryRevealAt: this.setting('gallery_reveal_at'),
      shots: Number(this.setting('shots')),
      predictionsLocked: this.setting('predictions_locked') === '1',
      songsOpen: this.setting('songs_open') === '1',
    }
  }

  join(input: Record<string, unknown>) {
    const name = clean(input.name, 60)
    if (name.length < 2) throw new HttpError(400, 'Please tell us your name.')
    const code = this.setting('join_code')
    if (code && normalise(clean(input.code, 40)) !== normalise(code)) throw new HttpError(403, 'That guest code doesn’t look right. It’s on your invitation.')
    const matches = this.sql.exec<{ id: number; name: string }>('SELECT id, name FROM people').toArray().filter(row => normalise(row.name) === normalise(name))
    const id = crypto.randomUUID()
    const token = randomToken()
    this.sql.exec('INSERT INTO guests (id, token, name, person_id, created_at) VALUES (?, ?, ?, ?, ?)', id, token, matches.length === 1 ? matches[0].name : name, matches.length === 1 ? matches[0].id : null, Date.now())
    return { token, me: this.me(this.sql.exec<Guest>('SELECT id, name, person_id, shots_used FROM guests WHERE id = ?', id).one()) }
  }

  me(guest: Guest) {
    const person = this.person(guest.person_id)
    return { id: guest.id, name: guest.name, linked: !!person, personName: person?.name ?? null, shotsUsed: guest.shots_used, shots: Number(this.setting('shots')) }
  }

  searchPeople(q: string) {
    const query = normalise(q)
    if (query.length < 2) return []
    return this.sql.exec<Person>('SELECT id, name FROM people ORDER BY name').toArray().filter(p => normalise(p.name).includes(query)).slice(0, 8).map(p => ({ id: p.id, name: p.name }))
  }

  link(guest: Guest, input: Record<string, unknown>) {
    const person = this.person(Number(input.personId))
    if (!person) throw new HttpError(404, 'We couldn’t find that name on the guest list.')
    this.sql.exec('UPDATE guests SET person_id = ? WHERE id = ?', person.id, guest.id)
    return this.me({ ...guest, person_id: person.id })
  }

  subscribe(guest: Guest, input: Record<string, unknown>) {
    const subscription = input.subscription as { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | undefined
    const endpoint = subscription?.endpoint ?? ''
    if (!endpoint.startsWith('https://') || !subscription?.keys?.p256dh || !subscription.keys.auth) throw new HttpError(400, 'That notification subscription is incomplete.')
    this.sql.exec(`INSERT INTO subscriptions (endpoint, guest_id, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET guest_id = excluded.guest_id, p256dh = excluded.p256dh, auth = excluded.auth`, endpoint, guest.id, subscription.keys.p256dh, subscription.keys.auth, Date.now())
    return { ok: true }
  }

  /** The iPhone and Android apps register an Expo push token, which Expo relays through Apple and Google. */
  subscribeExpo(guest: Guest, input: Record<string, unknown>) {
    const token = clean(input.token, 200)
    if (!/^Expo(nent)?PushToken\[.+\]$/.test(token)) throw new HttpError(400, 'That push token doesn’t look right.')
    this.sql.exec(`INSERT INTO subscriptions (endpoint, guest_id, kind, created_at) VALUES (?, ?, 'expo', ?)
      ON CONFLICT(endpoint) DO UPDATE SET guest_id = excluded.guest_id`, token, guest.id, Date.now())
    return { ok: true }
  }

  matchesAudience(audience: Audience, person: Person | null) {
    if (audience.kind === 'all') return true
    if (!person) return false
    if (audience.kind === 'tables') return audience.values.includes(person.table_name)
    return splitGroups(person.groups).some(group => audience.values.includes(group))
  }

  inbox(guest: Guest) {
    const person = this.person(guest.person_id)
    return this.sql.exec<{ id: number; title: string; body: string; url: string; audience: string; sent_by: string; send_at: number }>(
      "SELECT id, title, body, url, audience, sent_by, send_at FROM notifications WHERE status != 'scheduled' ORDER BY send_at DESC LIMIT 60",
    ).toArray().filter(n => this.matchesAudience(JSON.parse(n.audience), person)).map(({ audience: _a, ...n }) => n)
  }

  // ---------- seating ----------

  seat(guest: Guest, staff: Staff | null) {
    const revealed = this.setting('seating_revealed') === '1' || staff?.role === 'host'
    const person = this.person(guest.person_id)
    if (!person) return { revealed, linked: false }
    if (!revealed) return { revealed, linked: true, name: person.name }
    if (!person.table_name) return { revealed, linked: true, name: person.name, table: null }
    const tablemates = this.sql.exec<Person>('SELECT * FROM people WHERE table_name = ? ORDER BY seat, name', person.table_name).toArray()
    const index = tablemates.findIndex(p => p.id === person.id)
    const around = (offset: number) => tablemates.length > 1 ? tablemates[(index + offset + tablemates.length) % tablemates.length] : null
    const left = around(-1)
    const right = tablemates.length > 2 ? around(1) : null
    const card = (p: Person | null) => p && { id: p.id, name: p.name, seat: p.seat, intro: p.intro }
    return {
      revealed, linked: true, name: person.name, table: person.table_name, seat: person.seat,
      neighbours: [card(left), card(right)].filter(Boolean),
      tablemates: tablemates.map(p => ({ id: p.id, name: p.name, seat: p.seat, me: p.id === person.id })),
    }
  }

  replacePeople(input: Record<string, unknown>) {
    const rows = Array.isArray(input.people) ? input.people as Record<string, unknown>[] : []
    if (rows.length > 600) throw new HttpError(400, 'That is a very big guest list. Please keep it under 600 names.')
    const existing = new Map(this.sql.exec<Person>('SELECT * FROM people').toArray().map(p => [normalise(p.name), p.id]))
    const kept = new Set<number>()
    for (const row of rows) {
      const name = clean(row.name, 80)
      if (!name) continue
      const values = [clean(row.table, 60), Math.max(0, Math.floor(Number(row.seat) || 0)), clean(row.intro, 280), clean(row.groups, 200)] as const
      const id = existing.get(normalise(name))
      if (id != null && !kept.has(id)) {
        this.sql.exec('UPDATE people SET name = ?, table_name = ?, seat = ?, intro = ?, groups = ? WHERE id = ?', name, ...values, id)
        kept.add(id)
      } else {
        kept.add(this.sql.exec<{ id: number }>('INSERT INTO people (name, table_name, seat, intro, groups) VALUES (?, ?, ?, ?, ?) RETURNING id', name, ...values).one().id)
      }
    }
    for (const id of existing.values()) if (!kept.has(id)) {
      this.sql.exec('DELETE FROM people WHERE id = ?', id)
      this.sql.exec('UPDATE guests SET person_id = NULL WHERE person_id = ?', id)
    }
    // Anyone who joined before the list existed is matched up by name now.
    for (const guest of this.sql.exec<{ id: string; name: string }>('SELECT id, name FROM guests WHERE person_id IS NULL').toArray()) {
      const matches = this.sql.exec<Person>('SELECT id, name FROM people').toArray().filter(p => normalise(p.name) === normalise(guest.name))
      if (matches.length === 1) this.sql.exec('UPDATE guests SET person_id = ? WHERE id = ?', matches[0].id, guest.id)
    }
    return { count: kept.size }
  }

  // ---------- notifications ----------

  audiences() {
    const people = this.sql.exec<Person>('SELECT * FROM people').toArray()
    const tables = [...new Set(people.map(p => p.table_name).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    const groups = [...new Set(people.flatMap(p => splitGroups(p.groups)))].sort()
    return { tables, groups }
  }

  overview() {
    const count = (sql: string) => this.sql.exec<{ n: number }>(sql).one().n
    return {
      guests: count('SELECT COUNT(*) AS n FROM guests'),
      subscribed: count('SELECT COUNT(DISTINCT guest_id) AS n FROM subscriptions'),
      people: count('SELECT COUNT(*) AS n FROM people'),
      photos: count('SELECT COUNT(*) AS n FROM photos'),
      songs: count('SELECT COUNT(*) AS n FROM songs WHERE hidden = 0'),
      ...this.audiences(),
      hostPasscodeSet: !!this.env.HOST_PASSCODE,
    }
  }

  sentNotifications() {
    return this.sql.exec('SELECT * FROM notifications ORDER BY send_at DESC LIMIT 100').toArray().map(n => ({ ...n, audience: JSON.parse(String(n.audience)) }))
  }

  async notify(staff: Staff, input: Record<string, unknown>) {
    const title = clean(input.title, 80)
    const body = clean(input.body, 240)
    if (!title || !body) throw new HttpError(400, 'A notification needs a title and a message.')
    const raw = input.audience as { kind?: string; values?: unknown[] } | undefined
    const audience: Audience = raw?.kind === 'tables' || raw?.kind === 'groups'
      ? { kind: raw.kind, values: (raw.values ?? []).map(v => clean(v, 60)).filter(Boolean) }
      : { kind: 'all' }
    if (audience.kind !== 'all' && !audience.values.length) throw new HttpError(400, 'Pick at least one table or group.')
    const sendAt = input.sendAt ? Date.parse(String(input.sendAt)) : Date.now()
    if (Number.isNaN(sendAt)) throw new HttpError(400, 'That send time doesn’t look right.')
    const scheduled = sendAt > Date.now() + 30_000
    const url = clean(input.url, 80) || '/app/#home'
    const id = this.sql.exec<{ id: number }>(
      'INSERT INTO notifications (title, body, url, audience, sent_by, send_at, status) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
      title, body, url, JSON.stringify(audience), staff.label, scheduled ? sendAt : Date.now(), scheduled ? 'scheduled' : 'sending',
    ).one().id
    if (!scheduled) this.enqueue(id, audience)
    await this.scheduleAlarm()
    return { id, scheduled, recipients: scheduled ? null : this.sql.exec<{ n: number }>('SELECT COUNT(*) AS n FROM push_queue WHERE notification_id = ?', id).one().n }
  }

  enqueue(notificationId: number, audience: Audience) {
    const rows = this.sql.exec<{ endpoint: string; person_id: number | null }>('SELECT s.endpoint, g.person_id FROM subscriptions s JOIN guests g ON g.id = s.guest_id').toArray()
    const people = new Map(this.sql.exec<Person>('SELECT * FROM people').toArray().map(p => [p.id, p]))
    for (const row of rows) {
      if (this.matchesAudience(audience, row.person_id == null ? null : people.get(row.person_id) ?? null)) {
        this.sql.exec('INSERT INTO push_queue (notification_id, endpoint) VALUES (?, ?)', notificationId, row.endpoint)
      }
    }
    if (!rows.length || !this.sql.exec('SELECT 1 FROM push_queue WHERE notification_id = ? LIMIT 1', notificationId).toArray().length) {
      this.sql.exec("UPDATE notifications SET status = 'sent' WHERE id = ?", notificationId)
    }
  }

  async scheduleAlarm() {
    const queued = this.sql.exec('SELECT 1 FROM push_queue LIMIT 1').toArray().length > 0
    const next = this.sql.exec<{ t: number | null }>("SELECT MIN(send_at) AS t FROM notifications WHERE status = 'scheduled'").one().t
    const when = queued ? Date.now() : next
    if (when == null) { await this.ctx.storage.deleteAlarm(); return }
    await this.ctx.storage.setAlarm(Math.max(when, Date.now()))
  }

  /** Sends due notifications a batch at a time, so a big guest list never hits a single request's limits. */
  async alarm() {
    for (const due of this.sql.exec<{ id: number; audience: string }>("SELECT id, audience FROM notifications WHERE status = 'scheduled' AND send_at <= ?", Date.now()).toArray()) {
      this.sql.exec("UPDATE notifications SET status = 'sending', send_at = ? WHERE id = ?", Date.now(), due.id)
      this.enqueue(due.id, JSON.parse(due.audience))
    }
    const batch = this.sql.exec<QueueItem>(
      'SELECT q.id, q.notification_id, q.endpoint, s.kind, s.p256dh, s.auth FROM push_queue q LEFT JOIN subscriptions s ON s.endpoint = q.endpoint ORDER BY q.id LIMIT ?', PUSH_BATCH,
    ).toArray()
    if (batch.length) {
      const notes = new Map<number, { title: string; body: string; url: string }>()
      for (const id of new Set(batch.map(item => item.notification_id))) {
        const n = this.sql.exec<{ title: string; body: string; url: string }>('SELECT title, body, url FROM notifications WHERE id = ?', id).toArray()[0]
        if (n) notes.set(id, n)
      }
      const outcome = new Map<number, 'ok' | 'failed' | 'gone'>()
      await Promise.all([this.sendWeb(batch.filter(item => item.kind === 'web'), notes, outcome), this.sendExpo(batch.filter(item => item.kind === 'expo'), notes, outcome)])
      for (const item of batch) {
        const result = outcome.get(item.id) ?? 'failed'
        if (result === 'gone') this.sql.exec('DELETE FROM subscriptions WHERE endpoint = ?', item.endpoint)
        this.sql.exec(`UPDATE notifications SET ${result === 'ok' ? 'delivered = delivered + 1' : 'failed = failed + 1'} WHERE id = ?`, item.notification_id)
        this.sql.exec('DELETE FROM push_queue WHERE id = ?', item.id)
      }
    }
    this.sql.exec("UPDATE notifications SET status = 'sent' WHERE status = 'sending' AND id NOT IN (SELECT notification_id FROM push_queue)")
    await this.scheduleAlarm()
  }

  async sendWeb(items: QueueItem[], notes: Map<number, Note>, outcome: Map<number, Outcome>) {
    if (!items.length) return
    const keys = await this.vapid()
    await Promise.all(items.map(async item => {
      const note = notes.get(item.notification_id)
      if (!note || !item.p256dh || !item.auth) { outcome.set(item.id, 'failed'); return }
      try {
        const status = await sendPush({ endpoint: item.endpoint, p256dh: item.p256dh, auth: item.auth }, JSON.stringify({ ...note, tag: `note-${item.notification_id}` }), keys, 'https://imogenanddan.com')
        outcome.set(item.id, status >= 200 && status < 300 ? 'ok' : status === 404 || status === 410 ? 'gone' : 'failed')
      } catch { outcome.set(item.id, 'failed') }
    }))
  }

  /** Expo takes up to 100 messages a request and hands them to Apple (APNs) and Google (FCM). */
  async sendExpo(items: QueueItem[], notes: Map<number, Note>, outcome: Map<number, Outcome>) {
    for (let start = 0; start < items.length; start += 100) {
      const chunk = items.slice(start, start + 100).filter(item => notes.has(item.notification_id))
      if (!chunk.length) continue
      try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(chunk.map(item => {
            const note = notes.get(item.notification_id)!
            return { to: item.endpoint, title: note.title, body: note.body, data: { url: note.url }, sound: 'default', priority: 'high', channelId: 'weekend' }
          })),
        })
        const tickets = (await response.json() as { data?: { status: string; details?: { error?: string } }[] }).data ?? []
        chunk.forEach((item, index) => {
          const ticket = tickets[index]
          outcome.set(item.id, ticket?.status === 'ok' ? 'ok' : ticket?.details?.error === 'DeviceNotRegistered' ? 'gone' : 'failed')
        })
      } catch { chunk.forEach(item => outcome.set(item.id, 'failed')) }
    }
  }

  // ---------- photos ----------

  async takePhoto(guest: Guest, request: Request) {
    const shots = Number(this.setting('shots'))
    if (guest.shots_used >= shots) throw new HttpError(403, 'That’s the whole roll used. Your photos develop the morning after.')
    if (!(request.headers.get('Content-Type') ?? '').startsWith('image/jpeg')) throw new HttpError(400, 'Photos need to be JPEGs.')
    const data = await request.arrayBuffer()
    if (data.byteLength > MAX_PHOTO_BYTES || data.byteLength < 1000) throw new HttpError(400, 'That photo is too large to develop.')
    this.sql.exec('INSERT INTO photos (id, guest_id, data, taken_at) VALUES (?, ?, ?, ?)', crypto.randomUUID(), guest.id, data, Date.now())
    this.sql.exec('UPDATE guests SET shots_used = shots_used + 1 WHERE id = ?', guest.id)
    return { shotsUsed: guest.shots_used + 1, shots }
  }

  galleryOpen() { return Date.now() >= Date.parse(this.setting('gallery_reveal_at')) }

  gallery(guest: Guest | null, staff: Staff | null) {
    const revealAt = this.setting('gallery_reveal_at')
    const total = this.sql.exec<{ n: number }>('SELECT COUNT(*) AS n FROM photos').one().n
    if (!this.galleryOpen() && staff?.role !== 'host') {
      const mine = guest ? this.sql.exec<{ n: number }>('SELECT COUNT(*) AS n FROM photos WHERE guest_id = ?', guest.id).one().n : 0
      return { revealed: false, revealAt, total, mine }
    }
    const photos = this.sql.exec<{ id: string; taken_at: number; name: string | null; guest_id: string }>(
      'SELECT p.id, p.taken_at, p.guest_id, g.name FROM photos p LEFT JOIN guests g ON g.id = p.guest_id ORDER BY p.taken_at',
    ).toArray().map(p => ({ id: p.id, takenAt: p.taken_at, by: p.name ?? 'A guest', mine: p.guest_id === guest?.id }))
    return { revealed: true, revealAt, total, photos }
  }

  photo(id: string, staff: Staff | null) {
    if (!this.galleryOpen() && staff?.role !== 'host') throw new HttpError(403, 'Still developing.')
    const row = this.sql.exec<{ data: ArrayBuffer }>('SELECT data FROM photos WHERE id = ?', id).toArray()[0]
    if (!row) throw new HttpError(404, 'Not found')
    return new Response(row.data, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=86400' } })
  }

  // ---------- songs ----------

  songs(guest: Guest | null) {
    const mine = new Set(guest ? this.sql.exec<{ song_id: number }>('SELECT song_id FROM song_votes WHERE guest_id = ?', guest.id).toArray().map(r => r.song_id) : [])
    return this.sql.exec<{ id: number; title: string; artist: string; played: number; hidden: number; votes: number; created_at: number; requested_by: string | null }>(`
      SELECT s.id, s.title, s.artist, s.played, s.hidden, s.created_at, g.name AS requested_by, (SELECT COUNT(*) FROM song_votes v WHERE v.song_id = s.id) AS votes
      FROM songs s LEFT JOIN guests g ON g.id = s.guest_id WHERE s.hidden = 0 ORDER BY votes DESC, s.created_at
    `).toArray().map(s => ({ id: s.id, title: s.title, artist: s.artist, played: !!s.played, votes: s.votes, requestedBy: s.requested_by?.split(' ')[0] ?? 'A guest', voted: mine.has(s.id) }))
  }

  requestSong(guest: Guest, input: Record<string, unknown>) {
    if (this.setting('songs_open') !== '1') throw new HttpError(403, 'Requests are closed for now.')
    const title = clean(input.title, 100)
    const artist = clean(input.artist, 80)
    if (!title || !artist) throw new HttpError(400, 'Please add the song and the artist.')
    const recent = this.sql.exec<{ n: number }>('SELECT COUNT(*) AS n FROM songs WHERE guest_id = ? AND created_at > ?', guest.id, Date.now() - 3600_000).one().n
    if (recent >= 15) throw new HttpError(429, 'That’s plenty of requests for one hour. Vote for some others!')
    const duplicate = this.sql.exec<{ id: number; title: string; artist: string }>('SELECT id, title, artist FROM songs WHERE hidden = 0').toArray()
      .find(s => normalise(s.title) === normalise(title) && normalise(s.artist) === normalise(artist))
    const id = duplicate?.id ?? this.sql.exec<{ id: number }>('INSERT INTO songs (title, artist, guest_id, created_at) VALUES (?, ?, ?, ?) RETURNING id', title, artist, guest.id, Date.now()).one().id
    this.sql.exec('INSERT OR IGNORE INTO song_votes (song_id, guest_id) VALUES (?, ?)', id, guest.id)
    return { id, duplicate: !!duplicate }
  }

  voteSong(guest: Guest, id: number) {
    if (!this.sql.exec('SELECT 1 FROM songs WHERE id = ? AND hidden = 0', id).toArray().length) throw new HttpError(404, 'That song has gone.')
    const existing = this.sql.exec('SELECT 1 FROM song_votes WHERE song_id = ? AND guest_id = ?', id, guest.id).toArray().length
    if (existing) this.sql.exec('DELETE FROM song_votes WHERE song_id = ? AND guest_id = ?', id, guest.id)
    else this.sql.exec('INSERT INTO song_votes (song_id, guest_id) VALUES (?, ?)', id, guest.id)
    return { voted: !existing }
  }

  updateSong(id: number, input: Record<string, unknown>) {
    if (typeof input.played === 'boolean') this.sql.exec('UPDATE songs SET played = ? WHERE id = ?', input.played ? 1 : 0, id)
    if (typeof input.hidden === 'boolean') this.sql.exec('UPDATE songs SET hidden = ? WHERE id = ?', input.hidden ? 1 : 0, id)
    return { ok: true }
  }

  // ---------- Battle of the Bangers ----------

  battle(guest: Guest | null) {
    const songs = new Map(this.sql.exec<{ id: number; title: string; artist: string }>('SELECT id, title, artist FROM songs').toArray().map(s => [s.id, s]))
    const votes = this.sql.exec<{ match_id: number; pick: number; n: number }>('SELECT match_id, pick, COUNT(*) AS n FROM battle_votes GROUP BY match_id, pick').toArray()
    const mine = new Map(guest ? this.sql.exec<{ match_id: number; pick: number }>('SELECT match_id, pick FROM battle_votes WHERE guest_id = ?', guest.id).toArray().map(v => [v.match_id, v.pick]) : [])
    const tally = (match: number, pick: number) => votes.find(v => v.match_id === match && v.pick === pick)?.n ?? 0
    const matches = this.sql.exec<{ id: number; round: number; slot: number; a: number; b: number; winner: number | null }>('SELECT * FROM battle_matches ORDER BY round, slot').toArray()
      .map(m => ({ id: m.id, round: m.round, slot: m.slot, a: songs.get(m.a), b: songs.get(m.b), aVotes: tally(m.id, m.a), bVotes: tally(m.id, m.b), winner: m.winner, myPick: mine.get(m.id) ?? null }))
    const status = this.setting('battle_status')
    const finalMatch = matches.at(-1)
    return { status, round: Number(this.setting('battle_round')), rounds: Math.max(0, ...matches.map(m => m.round)), matches, champion: status === 'done' && finalMatch?.winner ? songs.get(finalMatch.winner) : null }
  }

  voteBattle(guest: Guest, input: Record<string, unknown>) {
    const match = this.sql.exec<{ id: number; round: number; a: number; b: number; winner: number | null }>('SELECT * FROM battle_matches WHERE id = ?', Number(input.matchId)).toArray()[0]
    if (!match || match.winner != null || this.setting('battle_status') !== 'voting' || match.round !== Number(this.setting('battle_round'))) throw new HttpError(400, 'Voting on that match has closed.')
    const pick = Number(input.pick)
    if (pick !== match.a && pick !== match.b) throw new HttpError(400, 'Pick one of the two songs.')
    this.sql.exec('INSERT INTO battle_votes (match_id, guest_id, pick) VALUES (?, ?, ?) ON CONFLICT(match_id, guest_id) DO UPDATE SET pick = excluded.pick', match.id, guest.id, pick)
    return { ok: true }
  }

  startBattle(input: Record<string, unknown>) {
    const size = [4, 8, 16].includes(Number(input.size)) ? Number(input.size) : 8
    const top = this.songs(null).filter(s => !s.played).slice(0, size)
    if (top.length < size) throw new HttpError(400, `The battle needs ${size} requested songs, and there are ${top.length} so far.`)
    this.resetBattle()
    // Classic seeding: the favourite meets the outsider in round one.
    for (let slot = 0; slot < size / 2; slot++) this.sql.exec('INSERT INTO battle_matches (round, slot, a, b) VALUES (1, ?, ?, ?)', slot, top[slot].id, top[size - 1 - slot].id)
    this.setSetting('battle_round', '1')
    this.setSetting('battle_status', 'voting')
    return this.battle(null)
  }

  advanceBattle() {
    if (this.setting('battle_status') !== 'voting') throw new HttpError(400, 'There is no battle round to close.')
    const round = Number(this.setting('battle_round'))
    const matches = this.sql.exec<{ id: number; slot: number; a: number; b: number }>('SELECT id, slot, a, b FROM battle_matches WHERE round = ? ORDER BY slot', round).toArray()
    const winners = matches.map(m => {
      const count = (pick: number) => this.sql.exec<{ n: number }>('SELECT COUNT(*) AS n FROM battle_votes WHERE match_id = ? AND pick = ?', m.id, pick).one().n
      const winner = count(m.b) > count(m.a) ? m.b : m.a
      this.sql.exec('UPDATE battle_matches SET winner = ? WHERE id = ?', winner, m.id)
      return winner
    })
    if (winners.length === 1) {
      this.setSetting('battle_status', 'done')
    } else {
      for (let slot = 0; slot < winners.length / 2; slot++) this.sql.exec('INSERT INTO battle_matches (round, slot, a, b) VALUES (?, ?, ?, ?)', round + 1, slot, winners[slot * 2], winners[slot * 2 + 1])
      this.setSetting('battle_round', String(round + 1))
    }
    return this.battle(null)
  }

  resetBattle() {
    this.sql.exec('DELETE FROM battle_votes')
    this.sql.exec('DELETE FROM battle_matches')
    this.setSetting('battle_round', '0')
    this.setSetting('battle_status', 'idle')
    return this.battle(null)
  }

  // ---------- predictions ----------

  predictions(guest: Guest | null) {
    const questions = this.sql.exec<{ id: number; question: string; kind: string; options: string; answer: string | null; points: number }>('SELECT * FROM predictions ORDER BY sort, id').toArray()
    const answers = this.sql.exec<{ prediction_id: number; guest_id: string; value: string }>('SELECT * FROM prediction_answers').toArray()
    const names = new Map(this.sql.exec<{ id: string; name: string }>('SELECT id, name FROM guests').toArray().map(g => [g.id, g.name]))
    const scores = new Map<string, number>()
    for (const q of questions) {
      if (q.answer == null || q.answer === '') continue
      const given = answers.filter(a => a.prediction_id === q.id)
      let winners: typeof given
      if (q.kind === 'number') {
        const target = Number(q.answer)
        const best = Math.min(...given.map(a => Math.abs(Number(a.value) - target)))
        winners = given.filter(a => Math.abs(Number(a.value) - target) === best)
      } else winners = given.filter(a => a.value === q.answer)
      for (const w of winners) scores.set(w.guest_id, (scores.get(w.guest_id) ?? 0) + q.points)
    }
    const leaderboard = [...scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([id, points]) => ({ name: names.get(id) ?? 'A guest', points, me: id === guest?.id }))
    return {
      locked: this.setting('predictions_locked') === '1',
      questions: questions.map(q => ({
        id: q.id, question: q.question, kind: q.kind, options: JSON.parse(q.options) as string[], answer: q.answer, points: q.points,
        mine: guest ? answers.find(a => a.prediction_id === q.id && a.guest_id === guest.id)?.value ?? null : null,
        entries: answers.filter(a => a.prediction_id === q.id).length,
      })),
      leaderboard,
      myPoints: guest ? scores.get(guest.id) ?? 0 : 0,
    }
  }

  answerPrediction(guest: Guest, id: number, input: Record<string, unknown>) {
    if (this.setting('predictions_locked') === '1') throw new HttpError(403, 'Predictions are locked in. Good luck!')
    const q = this.sql.exec<{ kind: string; options: string }>('SELECT kind, options FROM predictions WHERE id = ?', id).toArray()[0]
    if (!q) throw new HttpError(404, 'That question has gone.')
    const value = clean(input.value, 60)
    if (q.kind === 'number' ? !Number.isFinite(Number(value)) || value === '' : !(JSON.parse(q.options) as string[]).includes(value)) throw new HttpError(400, 'Please pick an answer.')
    this.sql.exec('INSERT INTO prediction_answers (prediction_id, guest_id, value) VALUES (?, ?, ?) ON CONFLICT(prediction_id, guest_id) DO UPDATE SET value = excluded.value', id, guest.id, value)
    return { ok: true }
  }

  savePrediction(id: number | null, input: Record<string, unknown>) {
    if (id == null) {
      const question = clean(input.question, 160)
      const kind = input.kind === 'number' ? 'number' : 'choice'
      const options = kind === 'choice' ? (Array.isArray(input.options) ? input.options : []).map(o => clean(o, 60)).filter(Boolean).slice(0, 8) : []
      if (!question || (kind === 'choice' && options.length < 2)) throw new HttpError(400, 'A question needs some words and, for multiple choice, at least two answers.')
      const sort = this.sql.exec<{ n: number }>('SELECT COALESCE(MAX(sort), 0) + 1 AS n FROM predictions').one().n
      this.sql.exec('INSERT INTO predictions (question, kind, options, points, sort) VALUES (?, ?, ?, ?, ?)', question, kind, JSON.stringify(options), Math.max(1, Number(input.points) || 10), sort)
    } else if ('answer' in input) {
      this.sql.exec('UPDATE predictions SET answer = ? WHERE id = ?', input.answer == null || input.answer === '' ? null : clean(input.answer, 60), id)
    }
    return this.predictions(null)
  }

  // ---------- host ----------

  staffLogin(input: Record<string, unknown>) {
    const code = clean(input.code, 80)
    const passcode = this.env.HOST_PASSCODE ?? ''
    let staff: Staff & { code: string | null } | null = null
    if (passcode && timingSafeEqual(code, passcode)) staff = { role: 'host', label: clean(input.label, 40) || 'Imogen & Dan', code: null }
    else {
      const row = this.sql.exec<{ code: string; role: Role; label: string }>('SELECT * FROM staff_codes WHERE code = ?', code.toUpperCase()).toArray()[0]
      if (row) staff = { role: row.role, label: row.label, code: row.code }
    }
    if (!staff) throw new HttpError(403, passcode ? 'That code isn’t right.' : 'That code isn’t right. (The couple’s passcode hasn’t been set up in Cloudflare yet.)')
    const token = randomToken()
    this.sql.exec('INSERT INTO staff_sessions (token, role, label, code, created_at) VALUES (?, ?, ?, ?, ?)', token, staff.role, staff.label, staff.code, Date.now())
    return { token, role: staff.role, label: staff.label }
  }

  createCode(input: Record<string, unknown>) {
    const role: Role = input.role === 'dj' ? 'dj' : 'helper'
    const label = clean(input.label, 40)
    if (!label) throw new HttpError(400, 'Who is this code for?')
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const code = Array.from(crypto.getRandomValues(new Uint8Array(6)), byte => alphabet[byte % alphabet.length]).join('')
    this.sql.exec('INSERT INTO staff_codes (code, role, label) VALUES (?, ?, ?)', code, role, label)
    return { code, role, label }
  }

  updateSettings(input: Record<string, unknown>) {
    const flags = ['seating_revealed', 'predictions_locked', 'songs_open']
    for (const key of flags) if (typeof input[key] === 'boolean') this.setSetting(key, input[key] ? '1' : '0')
    if (typeof input.gallery_reveal_at === 'string' && !Number.isNaN(Date.parse(input.gallery_reveal_at))) this.setSetting('gallery_reveal_at', new Date(input.gallery_reveal_at).toISOString())
    if (input.shots != null) this.setSetting('shots', String(Math.min(60, Math.max(1, Math.floor(Number(input.shots) || 20)))))
    if (typeof input.join_code === 'string') this.setSetting('join_code', clean(input.join_code, 40))
    return Object.fromEntries(Object.keys(SETTINGS_DEFAULTS).map(key => [key, this.setting(key)]))
  }
}

/**
 * Web Push with no dependencies: VAPID (RFC 8292) and aes128gcm payload encryption (RFC 8291),
 * using only the WebCrypto built into Workers.
 */

export type VapidKeys = { publicKey: string; privateJwk: JsonWebKey }
export type PushTarget = { endpoint: string; p256dh: string; auth: string }

const textEncoder = new TextEncoder()
const encoder = { encode: (text: string) => new Uint8Array(textEncoder.encode(text)) as Uint8Array<ArrayBuffer> }

export function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  for (const byte of array) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromB64url(text: string): Uint8Array<ArrayBuffer> {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((text.length + 3) % 4)
  const binary = atob(base64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

function concat(...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0))
  let offset = 0
  for (const part of parts) { out.set(part, offset); offset += part.length }
  return out
}

export async function generateVapidKeys(): Promise<VapidKeys> {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']) as CryptoKeyPair
  const raw = await crypto.subtle.exportKey('raw', pair.publicKey) as ArrayBuffer
  const privateJwk = await crypto.subtle.exportKey('jwk', pair.privateKey) as JsonWebKey
  return { publicKey: b64url(raw), privateJwk }
}

async function vapidHeader(endpoint: string, keys: VapidKeys, subject: string): Promise<string> {
  const audience = new URL(endpoint).origin
  const header = b64url(encoder.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const claims = b64url(encoder.encode(JSON.stringify({ aud: audience, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject })))
  const key = await crypto.subtle.importKey('jwk', keys.privateJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, encoder.encode(`${header}.${claims}`))
  return `vapid t=${header}.${claims}.${b64url(signature)}, k=${keys.publicKey}`
}

async function hkdf(salt: Uint8Array<ArrayBuffer>, ikm: Uint8Array<ArrayBuffer>, info: Uint8Array<ArrayBuffer>, length: number) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length * 8))
}

/** Encrypts a payload for one browser subscription, as an aes128gcm body with a single record. */
export async function encryptPayload(target: PushTarget, payload: string): Promise<Uint8Array<ArrayBuffer>> {
  const clientPublic = fromB64url(target.p256dh)
  const authSecret = fromB64url(target.auth)
  const local = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']) as CryptoKeyPair
  const localPublic = new Uint8Array(await crypto.subtle.exportKey('raw', local.publicKey) as ArrayBuffer)
  const clientKey = await crypto.subtle.importKey('raw', clientPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: clientKey } as unknown as SubtleCryptoDeriveKeyAlgorithm, local.privateKey, 256))

  const ikm = await hkdf(authSecret, shared, concat(encoder.encode('WebPush: info\0'), clientPublic, localPublic), 32)
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const contentKey = await hkdf(salt, ikm, encoder.encode('Content-Encoding: aes128gcm\0'), 16)
  const nonce = await hkdf(salt, ikm, encoder.encode('Content-Encoding: nonce\0'), 12)

  const aes = await crypto.subtle.importKey('raw', contentKey, 'AES-GCM', false, ['encrypt'])
  // A single, final record: the plaintext followed by the 0x02 delimiter.
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aes, concat(encoder.encode(payload), new Uint8Array([2]))))

  const header = new Uint8Array(16 + 4 + 1 + localPublic.length)
  header.set(salt, 0)
  new DataView(header.buffer).setUint32(16, 4096)
  header[20] = localPublic.length
  header.set(localPublic, 21)
  return concat(header, cipher)
}

/** Sends one push message. Resolves to the push service's HTTP status. */
export async function sendPush(target: PushTarget, payload: string, keys: VapidKeys, subject: string): Promise<number> {
  const body = await encryptPayload(target, payload)
  const response = await fetch(target.endpoint, {
    method: 'POST',
    headers: {
      Authorization: await vapidHeader(target.endpoint, keys, subject),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(6 * 3600),
      Urgency: 'high',
    },
    body,
  })
  return response.status
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import { api } from './api'

/** Loads an API path and refreshes it every `every` ms while the app is in the foreground. */
export function useApi<T>(path: string | null, every = 0) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const pathRef = useRef(path)
  useEffect(() => { pathRef.current = path }, [path])
  const reload = useCallback(async () => {
    if (!pathRef.current) return
    try { setData(await api<T>(pathRef.current)); setError('') } catch (e) { setError((e as Error).message) }
  }, [])
  const refresh = useCallback(async () => { setRefreshing(true); await reload(); setRefreshing(false) }, [reload])
  useEffect(() => {
    reload()
    const sub = AppState.addEventListener('change', state => { if (state === 'active') reload() })
    const timer = every ? setInterval(() => { if (AppState.currentState === 'active') reload() }, every) : undefined
    return () => { sub.remove(); if (timer) clearInterval(timer) }
  }, [path, every, reload])
  return { data, error, reload, refresh, refreshing, setData }
}

export function useNow(every = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), every); return () => clearInterval(timer) }, [every])
  return now
}

export function timeAgo(at: number, now = Date.now()) {
  const minutes = Math.round((now - at) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  return new Date(at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export const formatWhen = (iso: string | number) => new Date(iso).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })
export const initials = (name: string) => name.split(' ').filter(Boolean).map(word => word[0]).slice(0, 2).join('').toUpperCase()

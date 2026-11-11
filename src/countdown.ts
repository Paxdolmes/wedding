import { useEffect, useState } from 'react'

const weddingDay = new Date('2028-08-24T14:00:00+01:00').getTime()

/** Whole days until the wedding, kept up to date while the page is open. */
export function useDaysToGo() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(timer) }, [])
  return Math.max(0, Math.ceil((weddingDay - now) / 86_400_000))
}

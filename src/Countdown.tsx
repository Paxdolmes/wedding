import { useDaysToGo } from './countdown'
import './Countdown.css'

/** "652 days to go", as on the invitation. */
export function Countdown() {
  const days = useDaysToGo()
  return <p className="countdown"><span className="countdown-days foil">{days.toLocaleString('en-GB')}</span><span className="label">days to go</span></p>
}

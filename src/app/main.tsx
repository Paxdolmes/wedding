import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/cormorant-garamond/wght.css'
import '@fontsource-variable/cormorant-garamond/wght-italic.css'
import '@fontsource-variable/jost/wght.css'
import '@fontsource/pinyon-script/400.css'
import '../index.css'
import './app.css'
import { GuestApp } from './GuestApp'
import { registerWorker } from './push'

createRoot(document.getElementById('root')!).render(<StrictMode><GuestApp /></StrictMode>)
registerWorker()

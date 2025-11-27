import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Globe from './globe/globe'




createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Globe />
  </StrictMode>,
)

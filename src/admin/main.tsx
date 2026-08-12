import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import '../index.css'
import { AdminApp } from './AdminApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AdminApp />
    <Analytics />
  </StrictMode>,
)

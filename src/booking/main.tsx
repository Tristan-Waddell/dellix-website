import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import '../index.css'
import { BookingPage } from './BookingPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BookingPage />
    <Analytics />
  </StrictMode>,
)

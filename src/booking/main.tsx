import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { BookingPage } from './BookingPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BookingPage />
  </StrictMode>,
)

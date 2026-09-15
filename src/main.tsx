import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GameApplication } from './app/GameApplication'
import './ui/styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><GameApplication /></StrictMode>,
)

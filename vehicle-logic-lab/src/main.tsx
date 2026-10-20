import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './game/Game'
import 'pretendard/dist/web/static/pretendard.css'
import './ui/styles.css'
import './game/game.css'
import './game/polish.css'
import './game/experience.css'
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>)

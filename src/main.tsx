import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GameApplication } from './app/GameApplication'
import './ui/styles.css'
import vehicleSwUrl from './runtime/c/generated/vehicle-sw.wasm?url'

const root = document.getElementById('root')!
root.textContent = '차량 제어 소프트웨어를 준비하고 있습니다…'
fetch(vehicleSwUrl).then(async response => {
  if (!response.ok) throw new Error(`Vehicle SW load: ${response.status}`)
  const module = await WebAssembly.compile(await response.arrayBuffer())
  createRoot(root).render(<StrictMode><GameApplication vehicleSwModule={module} /></StrictMode>)
}).catch(error => {
  root.textContent = `차량 제어 소프트웨어를 불러오지 못했습니다. ${String(error)}`
})

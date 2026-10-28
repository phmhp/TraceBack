import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GameApplication } from './app/GameApplication'
import {useNavigation} from './ui/state/navigation'
import 'pretendard/dist/web/variable/pretendardvariable.css'
import './ui/styles.css'
import './ui/campaign.css'
import vehicleSwUrl from './runtime/c/generated/vehicle-sw.wasm?url&inline'

const root = document.getElementById('root')!
root.textContent = '차량 제어 소프트웨어를 준비하고 있습니다…'
Promise.resolve().then(async () => {
  // Inline data asset is packaged locally; no file:// fetch or development server is required.
  if(!vehicleSwUrl.startsWith('data:'))throw new Error('Vehicle SW must be bundled inline')
  const bytes=Uint8Array.from(atob(vehicleSwUrl.slice(vehicleSwUrl.indexOf(',')+1)),character=>character.charCodeAt(0))
  const module = await WebAssembly.compile(bytes)
  useNavigation.getState().next()
  createRoot(root).render(<StrictMode><GameApplication vehicleSwModule={module} /></StrictMode>)
}).catch(error => {
  root.textContent = `차량 제어 소프트웨어를 불러오지 못했습니다. ${String(error)}`
})

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './ui/App'
import { useStore } from './store'
import { sceneApi } from './scene/SceneRoot'
;(window as unknown as { __store: typeof useStore; __sceneApi: typeof sceneApi }).__store = useStore
;(window as unknown as { __sceneApi: typeof sceneApi }).__sceneApi = sceneApi

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

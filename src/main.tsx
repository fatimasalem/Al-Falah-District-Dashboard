import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { InsightsProvider } from './context/InsightsContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <InsightsProvider>
      <App />
    </InsightsProvider>
  </StrictMode>,
)

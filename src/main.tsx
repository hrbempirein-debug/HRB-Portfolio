import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/space-grotesk'
import './styles/index.css'
import App from './App.tsx'

if (import.meta.env.DEV) {
  import('./data/contentValidation').then(({ validateContent }) => validateContent())
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
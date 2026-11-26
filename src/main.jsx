import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter, matchPath } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Dashboard links can apply filters during navigation. A new document starts with all orders.
const url = new URL(window.location.href)
if (matchPath('/adminfuudr/orders', url.pathname) &&
    (url.searchParams.has('status') || url.searchParams.has('date'))) {
  url.searchParams.delete('status')
  url.searchParams.delete('date')
  window.history.replaceState(window.history.state, '', url)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)

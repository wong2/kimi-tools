import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="p-5 min-h-screen">
      <App />
    </div>
  </React.StrictMode>,
)

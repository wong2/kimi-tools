import { GlobalStyles } from '@mui/joy'
import { CssVarsProvider } from '@mui/joy/styles'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CssVarsProvider defaultMode="system">
      <GlobalStyles
        styles={{
          svg: {
            color: 'var(--Icon-color)',
            margin: 'var(--Icon-margin)',
            fontSize: 'var(--Icon-fontSize, 24px)',
          },
        }}
      />
      <div className="p-5 min-h-screen">
        <App />
      </div>
    </CssVarsProvider>
  </React.StrictMode>,
)

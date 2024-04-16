import { defineConfig } from 'wxt'
import react from '@vitejs/plugin-react'

export default defineConfig({
  manifest: {
    name: 'Kimi Copilot - 网页总结助手',
    description: '用Kimi AI一键总结网页内容',
    version: '1.8.5',
    action: {},
    permissions: ['sidePanel', 'activeTab', 'storage', 'scripting', 'notifications'],
    host_permissions: ['https://*.moonshot.cn/*', 'https://*.volces.com/*'],
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Ctrl+Shift+K',
          windows: 'Ctrl+Shift+K',
          linux: 'Ctrl+Shift+K',
          chromeos: 'Ctrl+Shift+K',
          mac: 'Command+Shift+K',
        },
      },
    },
  },
  vite: () => ({
    plugins: [react()],
  }),
})

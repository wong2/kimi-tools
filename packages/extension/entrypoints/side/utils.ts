import { storage } from 'wxt/storage'

export interface KimiTokens {
  refreshToken: string
  accessToken?: string
}

export async function getKimiAuthTokens() {
  return storage.getItem<KimiTokens>('local:kimi_tokens')
}

export async function setKimiAuthTokens(tokens: KimiTokens) {
  await storage.setItem('local:kimi_tokens', tokens)
}

export async function clearKimiAuthTokens() {
  await storage.removeItem('local:kimi_tokens')
}

export async function loadRefreshTokenFromTab(tabId: number): Promise<string | null> {
  const results = await browser.scripting.executeScript({
    target: { tabId },
    func: () => localStorage.getItem('refresh_token'),
  })
  return results[0]?.result
}

export async function loadKimiAuthTokens(): Promise<KimiTokens | null> {
  const tokens = await getKimiAuthTokens()
  if (tokens) {
    return tokens
  }
  const tab = await browser.tabs.create({ url: 'https://www.kimi.com/', active: false })
  const refreshToken = await loadRefreshTokenFromTab(tab.id!)
  await browser.tabs.remove(tab.id!)
  if (refreshToken) {
    await setKimiAuthTokens({ refreshToken })
    return { refreshToken }
  }
  return null
}

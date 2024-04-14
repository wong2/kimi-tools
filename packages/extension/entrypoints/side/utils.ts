import sanitize from 'sanitize-html'
import { storage } from 'wxt/storage'
import { BILIBILI_VIDEO_REGEX, readBilibiliVideoContent } from './bilibili'

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
  const tab = await browser.tabs.create({ url: 'https://kimi.moonshot.cn/', active: false })
  const refreshToken = await loadRefreshTokenFromTab(tab.id!)
  await browser.tabs.remove(tab.id!)
  if (refreshToken) {
    await setKimiAuthTokens({ refreshToken })
    return { refreshToken }
  }
  return null
}

function buildHTML(title: string, bodyHtml: string) {
  const body = sanitize(bodyHtml).trim()
  const result = `<!DOCTYPE html>
<html>
<title>${title}</title>
<body>
${body}
</body>
</html>`
  return result
}

export async function readPageContent(
  tabId: number,
  tabUrl: string,
): Promise<{ contentFile?: File; fallbackText: string }> {
  if (BILIBILI_VIDEO_REGEX.test(tabUrl)) {
    const [contentFile, fallbackText] = await Promise.all([
      readBilibiliVideoContent(tabId, tabUrl).catch((e) => {
        console.error('readBilibiliVideoContent', e)
        return undefined
      }),
      browser.scripting
        .executeScript({
          target: { tabId },
          func: () => document.body.innerText,
        })
        .then((results) => results[0].result),
    ])
    return { contentFile, fallbackText }
  }
  const results = await browser.scripting.executeScript({
    target: { tabId },
    func: () => ({
      title: document.title,
      bodyHtml: document.body.outerHTML,
      text: document.body.innerText,
    }),
  })
  const { title, bodyHtml, text } = results[0].result
  const contentFile = new File([buildHTML(title, bodyHtml)], `${title || 'webpage'}.html`, { type: 'text/html' })
  return {
    contentFile,
    fallbackText: text.trim(),
  }
}

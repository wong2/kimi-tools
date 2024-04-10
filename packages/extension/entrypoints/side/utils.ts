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

export async function readPageContent(tabId: number): Promise<string | undefined> {
  try {
    const results = await browser.scripting.executeScript({
      target: { tabId },
      func: () => document.body.innerText,
    })
    return results[0]?.result?.trim()
  } catch (e) {
    console.error('executeScript', e)
  }
}

export function buildPrompt(pageUrl: string, pageContent: string) {
  let prompt = `
你是一个擅长总结长文本的助手，能够总结用户给出的文本，并生成中文摘要。

##工作流程：
让我们一步一步思考，阅读我提供的内容，并做出以下操作：
- 一句话总结这篇文章，标题为“概述”
- 总结文章内容并写成摘要，标题为“摘要”

文章链接：<url>${pageUrl}</url>`.trim()
  if (pageContent) {
    prompt += `\n\n如果你无法访问这个链接，请根据下面的文本内容回答：\n${pageContent}`
  }
  return prompt
}

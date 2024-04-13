export const DEFAULT_PROMPT = '请返回您反复阅读正文后精心写成的详尽笔记'

export async function loadCustomPrompt(): Promise<string | null> {
  return storage.getItem('local:custom_prompt')
}

export async function setCustomPrompt(prompt: string) {
  if (prompt) {
    await storage.setItem('local:custom_prompt', prompt)
  } else {
    await storage.removeItem('local:custom_prompt')
  }
}

export async function buildPrompt(pageUrl: string, pageContent: string) {
  const customPrompt = await loadCustomPrompt()
  let prompts = [customPrompt || DEFAULT_PROMPT]
  prompts.push(`网页链接：${pageUrl}`)
  if (pageContent) {
    prompts.push(pageContent)
  }
  return prompts.join('\n\n')
}

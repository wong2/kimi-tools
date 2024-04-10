export const DEFAULT_PROMPT = `
你是一个擅长总结长文本的助手，能够总结用户给出的文本，并生成中文摘要。

##工作流程：
让我们一步一步思考，阅读我提供的内容，并做出以下操作：
- 一句话总结这篇文章，标题为“概述”
- 总结文章内容并写成摘要，标题为“摘要”`.trim()

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
  let prompt = `${customPrompt || DEFAULT_PROMPT}\n\n文章链接：<url>${pageUrl}</url>`
  if (pageContent) {
    prompt += `\n\n如果你无法访问这个链接，请根据下面的文本内容回答：\n${pageContent}`
  }
  return prompt
}

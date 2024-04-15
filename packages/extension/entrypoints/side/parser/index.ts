import sanitize from 'sanitize-html'
import { BILIBILI_VIDEO_REGEX, readBilibiliVideoContent } from './bilibili'

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

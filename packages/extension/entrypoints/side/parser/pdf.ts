export async function getPdfFile(tabId: number): Promise<File> {
  const results = await browser.scripting.executeScript({
    target: { tabId },
    func: async () => {
      const r = await fetch(window.location.href)
      return {
        title: document.title,
        buffer: await r.arrayBuffer(),
      }
    },
  })
  const { title, buffer } = results[0].result
  return new File([buffer], `${title || 'file'}.pdf`, { type: 'application/pdf' })
}

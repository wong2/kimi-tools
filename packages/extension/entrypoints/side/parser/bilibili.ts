export const BILIBILI_VIDEO_REGEX = /bilibili\.com\/video\/(\w+)/

export async function readBilibiliVideoContent(tabId: number, tabUrl: string) {
  const bvid = BILIBILI_VIDEO_REGEX.exec(tabUrl)![1]
  const results = await browser.scripting.executeScript({
    target: { tabId },
    func: async (vid) => {
      const r = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${vid}`).then((r) => r.json())
      const { title, desc, aid, cid } = r.data
      const { data: playerInfo } = await fetch(`https://api.bilibili.com/x/player/v2?aid=${aid}&cid=${cid}`, {
        credentials: 'include',
      }).then((r) => r.json())
      const subtitleUrl = playerInfo?.subtitle?.subtitles[0]?.subtitle_url
      if (!subtitleUrl) {
        return { title, desc, subtitles: '' }
      }
      const { body: subtitles } = await fetch(subtitleUrl).then((r) => r.json())
      return {
        title,
        desc,
        subtitles: subtitles.map((s: any) => s.content).join(' '),
      }
    },
    args: [bvid],
  })
  const { title, desc, subtitles } = results[0].result
  let content = `# ${title}\n\n${desc}\n\n`
  if (subtitles) {
    content += `## 视频文稿\n\n${subtitles}`
  }
  return new File([content], `${title}.md`, { type: 'text/markdown' })
}

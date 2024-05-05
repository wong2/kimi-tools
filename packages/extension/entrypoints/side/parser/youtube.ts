import { orderBy } from 'lodash-es'

export const YOUTUBE_VIDEO_REGEX = /(youtu.*be.*)\/watch/

const RE_XML_TRANSCRIPT = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g

interface CaptionTrack {
  baseUrl: string
  kind?: 'asr'
  languageCode: string
}

export async function readYoutubeVideoContent(tabId: number) {
  const results = await browser.scripting.executeScript({
    target: { tabId },
    world: 'MAIN',
    func: () => {
      const title = document.title
      const playerResponse = document.getElementsByTagName('ytd-app')[0].data.playerResponse
      if (!playerResponse?.captions) {
        return { title, captions: [] }
      }
      const captions = playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks
      return { title, captions }
    },
  })
  const { title, captions } = results[0].result as { title: string; captions: CaptionTrack[] }

  const sorted = orderBy(
    captions,
    (c) => {
      let score = c.kind === 'asr' ? 0 : 100
      if (c.languageCode === 'zh-CN' || c.languageCode === 'zh-Hans') {
        score += 3
      } else if (c.languageCode === 'zh-Hant') {
        score += 2
      } else if (c.languageCode === 'en') {
        score += 1
      }
      return score
    },
    'desc',
  )

  const transcriptUrl = sorted[0]?.baseUrl
  if (!transcriptUrl) {
    return
  }

  const rawTranscript = await fetch(transcriptUrl).then((r) => r.text())
  const transcripts = [...rawTranscript.matchAll(RE_XML_TRANSCRIPT)]

  const formatted = transcripts
    .map((t) => {
      const [, start, _duration, text] = t
      return `[${start}] ${text}`
    })
    .join('\n')

  const content = `# ${title}\n\n## 视频文稿\n\n${formatted}`
  return new File([content], `${title}.md`, { type: 'text/markdown' })
}

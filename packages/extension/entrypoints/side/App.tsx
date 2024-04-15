import { KimiWebClient } from '@kimi-tools/web-sdk'
import { FC, useCallback, useEffect, useState } from 'react'
import Markdown from 'react-markdown'
import { posthog } from '~/services/posthog'
import { buildPrompt } from '~/services/prompt'
import { Link, RatingLink } from './Link'
import './content.css'
import { readPageContent } from './parser'
import { KimiTokens, loadKimiAuthTokens, loadRefreshTokenFromTab, setKimiAuthTokens } from './utils'

const pageUrl = new URLSearchParams(location.search).get('url')!
const tabId = new URLSearchParams(location.search).get('tabId')!

const SummaryPage: FC<{ tokens: KimiTokens }> = ({ tokens }) => {
  const [summary, setSummary] = useState('')
  const [chatId, setChatId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function summarize(controller: AbortController) {
      setError('')
      const client = new KimiWebClient({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        onTokenRefreshed(tokens: KimiTokens) {
          console.debug('kimi tokens refreshed', tokens)
          setKimiAuthTokens(tokens)
        },
      })
      const { contentFile, fallbackText } = await readPageContent(+tabId, pageUrl).catch((e) => {
        console.error(e)
        return { contentFile: undefined, fallbackText: '' }
      })
      let fileId: string | undefined
      if (contentFile) {
        try {
          const file = await client.uploadFile(contentFile)
          const parseStatus = await client.parseProcess(file.id, { signal: controller.signal })
          if (parseStatus !== 'parsed') {
            throw new Error(`parse status: ${parseStatus}`)
          }
          fileId = file.id
        } catch (e) {
          console.error('file upload error', e)
        }
      }
      console.debug('fileId', fileId)
      if (!fileId && !fallbackText) {
        throw new Error(
          pageUrl.includes('chromewebstore.google.com')
            ? '由于技术限制，无法获取Chrome Web Store内容，换个页面试试吧'
            : '无法获取该网页内容，换个页面试试吧',
        )
      }
      const chat = await client.createChat()
      const prompt = await buildPrompt(pageUrl, fileId ? '' : fallbackText)
      for await (const event of client.sendMessage(chat.id, prompt, { fileId, signal: controller.signal })) {
        if (event.type === 'message') {
          setSummary(event.data)
        } else if (event.type === 'urls') {
          console.debug('urls', event.data)
        }
      }
      setChatId(chat.id)
    }
    const abortController = new AbortController()
    summarize(abortController).catch((err) => {
      if (!abortController.signal.aborted) {
        setError(err.message || '未知错误')
      }
    })
    return () => abortController.abort('unmount')
  }, [])

  return (
    <div>
      <div className="mb-4 flex flex-row items-center justify-between">
        <img src="/icon-128.png" className="size-4" />
        <span
          className="font-medium text-xs underline underline-offset-1 cursor-pointer"
          onClick={() => browser.runtime.openOptionsPage()}
        >
          选项
        </span>
      </div>
      {summary ? (
        <Markdown className="prose prose-sm dark:prose-invert markdown-body">{summary}</Markdown>
      ) : (
        !error && <Generating />
      )}
      {!!error && <div className="text-red-500 text-sm mt-1">{error}</div>}
      {!!chatId && (
        <div className="flex flex-row justify-between items-center mt-3">
          <div className="flex flex-row gap-3">
            <Link href={`https://kimi.moonshot.cn/chat/${chatId}`}>去Kimi继续对话</Link>
            <Link onClick={() => navigator.clipboard.writeText(summary)}>复制</Link>
          </div>
          <RatingLink />
        </div>
      )}
    </div>
  )
}

const Generating: FC = () => {
  const [dots, setDots] = useState('.')
  useEffect(() => {
    const timer = setInterval(() => {
      setDots((dots) => (dots.length >= 3 ? '' : dots + '.'))
    }, 500)
    return () => clearInterval(timer)
  }, [])
  return <span className="text-sm">读取中{dots}</span>
}

const Login: FC<{ setTokens: (tokens: KimiTokens) => void }> = (props) => {
  const login = useCallback(async () => {
    const tab = await browser.tabs.create({ url: 'https://kimi.moonshot.cn/', active: true })
    const timer = setInterval(async () => {
      try {
        const refreshToken = await loadRefreshTokenFromTab(tab.id!)
        console.debug('loadRefreshTokenFromTab', refreshToken)
        if (refreshToken) {
          clearInterval(timer)
          props.setTokens({ refreshToken })
        }
      } catch (e) {
        console.error(e)
        clearInterval(timer)
      }
    }, 1000)
  }, [])
  return (
    <div className="text-sm font-medium">
      请先
      <span className="text-blue-500 underline underline-offset-2 ml-0.5 cursor-pointer" onClick={login}>
        登录Kimi
      </span>
    </div>
  )
}

export default function App() {
  const [tokens, setTokens] = useState<KimiTokens | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadKimiAuthTokens().then((tokens) => {
      if (tokens) {
        setTokens(tokens)
      }
      setLoading(false)
    })
    posthog.capture('$pageview', { $current_url: 'side.html', tabUrl: pageUrl })
  }, [])

  if (loading) {
    return <span>...</span>
  }
  if (!tokens) {
    return <Login setTokens={setTokens} />
  }
  return <SummaryPage tokens={tokens} />
}

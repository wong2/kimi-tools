import { KimiWebClient } from '@kimi-tools/web-sdk'
import { FC, PropsWithChildren, useCallback, useEffect, useState } from 'react'
import Markdown from 'react-markdown'
import { buildPrompt } from '~/services/prompt'
import { posthog } from './posthog'
import { KimiTokens, loadKimiAuthTokens, loadRefreshTokenFromTab, readPageContent, setKimiAuthTokens } from './utils'

const pageUrl = new URLSearchParams(location.search).get('url')!
const tabId = new URLSearchParams(location.search).get('tabId')!

const Link: FC<PropsWithChildren<{ href: string }>> = ({ href, children }) => (
  <span
    className="text-blue-500 text-sm mt-3 font-medium block cursor-pointer"
    onClick={() => browser.tabs.create({ url: href })}
  >
    {children}
  </span>
)

const RatingLink: FC = () => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    storage.getItem<number>('local:open_times').then((value) => {
      const openTimes = (value || 0) + 1
      storage.setItem('local:open_times', openTimes)
      if (openTimes === 3) {
        setShow(true)
      }
    })
  }, [])

  if (!show) {
    return null
  }

  return (
    <Link href="https://chromewebstore.google.com/detail/kimi-copilot/icmdpfpmbfijfllafmfogmdabhijlehn/reviews">
      给个好评
    </Link>
  )
}

const SummaryPage: FC<{ tokens: KimiTokens; pageContent: string }> = ({ tokens, pageContent }) => {
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
      const chat = await client.createChat()
      const prompt = await buildPrompt(pageUrl, pageContent)
      for await (const event of client.sendMessage(chat.id, prompt, { signal: controller.signal })) {
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
        <article className="prose prose-sm dark:prose-invert">
          <Markdown>{summary}</Markdown>
        </article>
      ) : (
        !error && <Generating />
      )}
      {!!error && <div className="text-red-500 text-sm mt-1">{error}</div>}
      {!!chatId && (
        <div className="flex flex-row justify-between items-center mt-3">
          <Link href={`https://kimi.moonshot.cn/chat/${chatId}`}>去Kimi继续对话</Link>
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
  const [pageContent, setPageContent] = useState('')

  useEffect(() => {
    Promise.all([loadKimiAuthTokens(), readPageContent(+tabId)]).then(([tokens, content]) => {
      setPageContent(content || '')
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
  return <SummaryPage tokens={tokens} pageContent={pageContent} />
}

import { KimiWebClient } from '@kimi-tools/web-sdk'
import Markdown from 'react-markdown'
import { FC, useCallback, useEffect, useState } from 'react'
import { KimiTokens, loadKimiAuthTokens, loadRefreshTokenFromTab, readPageContent, setKimiAuthTokens } from './utils'

const pageUrl = new URLSearchParams(location.search).get('url')!
const tabId = new URLSearchParams(location.search).get('tabId')!

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
      let message = `用中文总结这个网页链接的内容：<url>${pageUrl}</url>`
      if (pageContent) {
        message += `\n\n如果你无法访问这个链接，请根据下面的内容进行简短的总结：\n${pageContent}`
      }
      for await (const event of client.sendMessage(chat.id, message, { signal: controller.signal })) {
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
      <h2 className="text-lg font-bold mb-3">总结</h2>
      {(summary || !error) && (
        <article className="prose prose-sm">
          <Markdown>{summary || '读取中...'}</Markdown>
        </article>
      )}
      {!!error && <div className="text-red-500 text-sm mt-1">{error}</div>}
      {!!chatId && (
        <a
          href={`https://kimi.moonshot.cn/chat/${chatId}`}
          target="_blank"
          rel="noreferrer"
          className="text-blue-500 text-sm mt-3 font-medium block"
        >
          去Kimi继续提问
        </a>
      )}
    </div>
  )
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
  }, [])

  if (loading) {
    return <span>...</span>
  }
  if (!tokens) {
    return <Login setTokens={setTokens} />
  }
  return <SummaryPage tokens={tokens} pageContent={pageContent} />
}

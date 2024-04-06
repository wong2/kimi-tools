import { KimiWebClient } from '@kimi-tools/web-sdk'
import Markdown from 'react-markdown'
import { FC, useCallback, useEffect, useState } from 'react'
import { KimiTokens, loadKimiAuthTokens, loadRefreshTokenFromTab, readPageContent, setKimiAuthTokens } from './utils'
import { posthog } from './posthog'

const pageUrl = new URLSearchParams(location.search).get('url')!
const tabId = new URLSearchParams(location.search).get('tabId')!

function buildPrompt(pageContent: string) {
  let prompt = `
你是一个擅长总结长文本的助手，能够总结用户给出的文本，并生成摘要。

##工作流程：
让我们一步一步思考，阅读我提供的内容，并做出以下操作：
- 一句话总结这篇文章，标题为“概述”
- 总结文章内容并写成摘要，标题为“摘要”

总是用中文回答；当你输出标题时，应该使用markdown ####格式。

文章链接：<url>${pageUrl}</url>`.trim()
  if (pageContent) {
    prompt += `\n\n如果你无法访问这个链接，请根据下面的文本内容回答：\n${pageContent}`
  }
  return prompt
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
      const prompt = buildPrompt(pageContent)
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
      {summary ? (
        <article className="prose prose-sm dark:prose-invert">
          <Markdown>{summary}</Markdown>
        </article>
      ) : (
        !error && <Generating />
      )}
      {!!error && <div className="text-red-500 text-sm mt-1">{error}</div>}
      {!!chatId && (
        <span
          className="text-blue-500 text-sm mt-3 font-medium block cursor-pointer"
          onClick={() => browser.tabs.create({ url: `https://kimi.moonshot.cn/chat/${chatId}` })}
        >
          去Kimi继续对话
        </span>
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

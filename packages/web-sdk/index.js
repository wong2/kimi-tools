import { EventSourceParserStream } from 'eventsource-parser/stream'
import { ofetch, FetchError } from 'ofetch'

async function* streamAsyncIterable(stream) {
  const reader = stream.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        return
      }
      yield value
    }
  } finally {
    reader.releaseLock()
  }
}

class KimiWebClient {
  constructor(options) {
    this.refreshToken = options.refreshToken
    this.accessToken = options.accessToken
    this.onTokenRefreshed = options.onTokenRefreshed
  }

  async request(url, options) {
    if (!this.accessToken) {
      await this.refreshAccessToken()
    }
    try {
      return await ofetch(url, {
        method: options.method,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Referer: 'https://kimi.moonshot.cn/',
        },
        body: options.body,
        signal: options.signal,
        responseType: options.responseType,
      })
    } catch (err) {
      console.error(err)
      if (err instanceof FetchError) {
        if (err.response?.status === 401) {
          await this.refreshAccessToken()
          return this.request(url, options)
        }
      }
      throw err
    }
  }

  async refreshAccessToken() {
    const resp = await ofetch('https://kimi.moonshot.cn/api/auth/token/refresh', {
      headers: {
        Authorization: `Bearer ${this.refreshToken}`,
      },
    })
    if (!resp.access_token || !resp.refresh_token) {
      throw new Error('Failed to refresh access token')
    }
    this.accessToken = resp.access_token
    this.refreshToken = resp.refresh_token
    this.onTokenRefreshed?.({ accessToken: this.accessToken, refreshToken: this.refreshToken })
  }

  async createChat() {
    const resp = await this.request('https://kimi.moonshot.cn/api/chat', {
      method: 'POST',
      body: {
        is_example: false,
        name: '未命名会话',
      },
    })
    return {
      id: resp.id,
    }
  }

  async preSignUrl(filename) {
    const resp = await this.request('https://kimi.moonshot.cn/api/pre-sign-url', {
      method: 'POST',
      body: {
        action: 'file',
        name: filename,
      },
    })
    return {
      url: resp.url,
      objectName: resp.object_name,
    }
  }

  async uploadFile(objectName, url, file) {
    await ofetch(url, { method: 'PUT', body: file })
    const resp = await this.request('https://kimi.moonshot.cn/api/file', {
      method: 'POST',
      body: {
        type: 'file',
        name: file.name,
        object_name: objectName,
      },
    })
    return {
      id: resp.id,
    }
  }

  async parseProcess(fileId, options = {}) {
    const streamBody = await this.request('https://kimi.moonshot.cn/api/file/parse_process', {
      method: 'POST',
      body: {
        ids: [fileId],
      },
      signal: options.signal,
      responseType: 'stream',
    })
    const eventStream = streamBody.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream())
    for await (const message of streamAsyncIterable(eventStream)) {
      if (message.type === 'event') {
        const payload = JSON.parse(message.data)
        if (payload.status !== 'parsing') {
          return payload.status
        }
      }
    }
  }

  async *sendMessage(chatId, content, options = {}) {
    const url = `https://kimi.moonshot.cn/api/chat/${chatId}/completion/stream`
    const streamBody = await this.request(url, {
      method: 'POST',
      body: {
        messages: [{ role: 'user', content: content }],
        refs: options.fileId ? [options.fileId] : [],
        use_search: options.useSearch || false,
      },
      signal: options.signal,
      responseType: 'stream',
    })

    let answer = ''
    const eventStream = streamBody.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream())
    for await (const message of streamAsyncIterable(eventStream)) {
      if (message.type === 'event') {
        const payload = JSON.parse(message.data)
        if (payload.event === 'cmpl') {
          answer += payload.text
          yield { type: 'message', data: answer }
        } else if (payload.event === 'content' && payload.msg?.url_refs) {
          yield { type: 'urls', data: payload.msg.url_refs }
        } else if (payload.event === 'all_done') {
          break
        }
      }
    }
  }
}

export { KimiWebClient }

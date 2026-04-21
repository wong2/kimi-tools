# Kimi Copilot - 网页总结助手

一款 Chrome 浏览器扩展，使用 Kimi AI 一键总结网页内容。

## 安装

[Chrome Web Store](https://chromewebstore.google.com/detail/kimi-copilot-%E7%BD%91%E9%A1%B5%E6%80%BB%E7%BB%93%E5%8A%A9%E6%89%8B/icmdpfpmbfijfllafmfogmdabhijlehn)

## 功能

- 一键总结当前网页内容，结果展示在侧边栏中
- 支持普通网页、PDF、YouTube 视频、Bilibili 视频等多种内容类型
- 支持自定义 Prompt，按照你的需求生成摘要
- 总结完成后可跳转到 Kimi 继续对话
- 快捷键支持（默认 `Ctrl+Shift+K` / `Cmd+Shift+K`）

## 使用方法

1. 安装扩展后，首次使用需登录 [Kimi](https://www.kimi.com/) 账号
2. 在任意网页上点击扩展图标或使用快捷键，即可在侧边栏查看 AI 生成的网页总结
3. 在扩展选项页中可以自定义 Prompt

## 开发

项目使用 pnpm workspace 管理，包含以下子包：

- `packages/extension` - 浏览器扩展主体（基于 [WXT](https://wxt.dev/) + React）
- `packages/web-sdk` - Kimi Web API 封装

### 本地开发

```bash
pnpm install
cd packages/extension
pnpm dev
```

### 构建

```bash
cd packages/extension
pnpm build
```

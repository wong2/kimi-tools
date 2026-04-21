# AGENTS.md

## 仓库结构

pnpm workspace，两个子包：

- `packages/extension` — 浏览器扩展主体（WXT + React）
- `packages/web-sdk` — Kimi Web API 封装

## 发布新版本

扩展通过 Chrome Web Store Developer Dashboard 手动上传发布，仓库内没有 CI 自动化。

### 1. Bump 版本号

只改 `packages/extension/wxt.config.ts` 里的 `manifest.version`。根据改动性质选择 bump 方式：

- bugfix / 小修复 → patch（例如 `1.14.0` → `1.14.1`）
- 新功能 → minor（例如 `1.14.0` → `1.15.0`）

> `packages/extension/package.json` 里的 `version` 字段是 `0.0.0`，不需要改。

### 2. 提交 release commit

遵循历史惯例，commit message 就是 `Release vX.Y.Z`，不带其它内容。

```bash
git add packages/extension/wxt.config.ts
git commit -m "Release vX.Y.Z"
git push
```

### 3. 打包 zip

```bash
cd packages/extension
pnpm zip
```

产物在 `packages/extension/.output/` 下，形如 `kimi-copilot-X.Y.Z-chrome.zip`。

如需发布 Firefox 版本再额外执行 `pnpm zip:firefox`。

### 4. 上传到 Chrome Web Store

到 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)，选中 `Kimi Copilot - 网页总结助手`，上传 zip，填写本次改动说明，提交审核。

## 开发

```bash
pnpm install
cd packages/extension
pnpm dev           # Chrome
pnpm dev:firefox   # Firefox
pnpm compile       # 类型检查
```

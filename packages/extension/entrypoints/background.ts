export default defineBackground(() => {
  browser.action.onClicked.addListener((tab) => {
    if (!tab.id || !tab.url || !(tab.url.startsWith('http') || tab.url.startsWith('file://'))) {
      return
    }
    if (!chrome.sidePanel || !chrome.sidePanel.open) {
      browser.notifications.create({
        type: 'basic',
        iconUrl: 'icon-128.png',
        title: 'Kimi Copilot',
        message: '不支持当前浏览器，请使用最新的原生Chrome',
      })
      return
    }
    chrome.sidePanel.setOptions({
      tabId: tab.id,
      enabled: true,
      path: `side.html?url=${encodeURIComponent(tab.url)}&tabId=${tab.id}`,
    })
    chrome.sidePanel.open({ tabId: tab.id })
  })
})

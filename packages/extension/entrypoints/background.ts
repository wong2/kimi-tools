export default defineBackground(() => {
  browser.action.onClicked.addListener((tab) => {
    if (!tab.id || !tab.url || !tab.url.startsWith('http') || !tab.url.startsWith('file://')) {
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

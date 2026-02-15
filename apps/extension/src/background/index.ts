import { MessageRouter } from './message-router';
import { ApiClient } from './api-client';

const apiClient = new ApiClient();
const router = new MessageRouter(apiClient);

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  router.handle(message, sender).then(sendResponse).catch((err) => {
    sendResponse({ error: err.message });
  });
  return true; // async response
});

// Context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'sourcetool-analyze',
    title: 'Analyze with SourceTool',
    contexts: ['selection', 'link'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'sourcetool-analyze') {
    const text = info.selectionText || info.linkUrl || '';
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'ANALYZE_SELECTION', data: text });
    }
  }
});

// Open side panel when extension icon is clicked (where supported)
chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true }).catch(() => {});

// When user switches tabs, ask content script to re-scrape
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && (tab.url.includes('amazon.') || tab.url.includes('walmart.') || tab.url.includes('ebay.'))) {
      chrome.tabs.sendMessage(activeInfo.tabId, { type: 'RESCRAPE' }).catch(() => {});
    }
  } catch {}
});

// When URL changes within a tab, re-trigger detection
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('amazon.') || tab.url.includes('walmart.') || tab.url.includes('ebay.')) {
      chrome.tabs.sendMessage(tabId, { type: 'RESCRAPE' }).catch(() => {});
    }
  }
});

console.log('SourceTool service worker initialized');

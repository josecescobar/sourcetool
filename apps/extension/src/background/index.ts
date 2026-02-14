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

console.log('SourceTool service worker initialized');

// Background service worker

chrome.runtime.onInstalled.addListener(() => {
  // Set default settings
  chrome.storage.sync.set({
    sensitivity: 0.7,
    action: 'blur',
    enabled: true,
    whitelist: [],
    blockedKeywords: [],
    passwordHash: '',
    passwordEnabled: false
  });
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    chrome.storage.sync.get(['sensitivity', 'action', 'enabled', 'whitelist', 'blockedKeywords'], (result) => {
      sendResponse(result);
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'updateSettings') {
    chrome.storage.sync.set(request.settings, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'checkPassword') {
    chrome.storage.sync.get(['passwordHash', 'passwordEnabled'], (result) => {
      if (!result.passwordEnabled) {
        sendResponse({ success: true });
        return;
      }
      
      const hashed = hashPassword(request.password);
      sendResponse({ success: hashed === result.passwordHash });
    });
    return true;
  }
  
  if (request.action === 'setPassword') {
    const hashed = hashPassword(request.password);
    chrome.storage.sync.set({ passwordHash: hashed, passwordEnabled: true }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'disablePassword') {
    chrome.storage.sync.set({ passwordHash: '', passwordEnabled: false }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Simple password hashing (for demonstration - use a proper library in production)
function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

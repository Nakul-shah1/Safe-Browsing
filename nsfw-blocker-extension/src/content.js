// Content script - runs on every page to detect and block NSFW content

let settings = {
  sensitivity: 0.7, // 0 to 1, higher = more strict
  action: 'blur', // 'blur' or 'remove'
  enabled: true,
  whitelist: [],
  blockedKeywords: []
};

let nsfwFilter = null;
let observer = null;
const processedElements = new WeakSet();

// Load settings from storage
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['sensitivity', 'action', 'enabled', 'whitelist', 'blockedKeywords'], (result) => {
      settings = {
        sensitivity: result.sensitivity !== undefined ? result.sensitivity : 0.7,
        action: result.action || 'blur',
        enabled: result.enabled !== undefined ? result.enabled : true,
        whitelist: result.whitelist || [],
        blockedKeywords: result.blockedKeywords || []
      };
      resolve(settings);
    });
  });
}

// Check if current domain is whitelisted
function isWhitelisted() {
  const hostname = window.location.hostname;
  return settings.whitelist.some(domain => 
    hostname === domain || hostname.endsWith('.' + domain)
  );
}

// Check if page should be blocked based on keywords
function checkKeywordBlocking() {
  const url = window.location.href.toLowerCase();
  const title = document.title.toLowerCase();
  
  for (const keyword of settings.blockedKeywords) {
    if (keyword.trim() && (url.includes(keyword.toLowerCase()) || title.includes(keyword.toLowerCase()))) {
      return true;
    }
  }
  return false;
}

// Block the entire page
function blockPage() {
  if (settings.action === 'remove') {
    document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#1a1a1a;color:#fff;font-family:Arial,sans-serif;"><div><h1>⚠️ Content Blocked</h1><p>This page has been blocked due to inappropriate content.</p></div></div>';
  } else {
    document.body.style.filter = 'blur(50px)';
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;justify-content:center;align-items:center;z-index:999999;color:#fff;font-family:Arial,sans-serif;';
    overlay.innerHTML = '<div style="text-align:center;"><h1>⚠️ Content Blocked</h1><p>This page has been blurred due to inappropriate content.</p><button id="showContent" style="padding:10px 20px;margin-top:20px;cursor:pointer;background:#4CAF50;color:white;border:none;border-radius:5px;">Show Content</button></div>';
    document.body.appendChild(overlay);
    
    document.getElementById('showContent').addEventListener('click', () => {
      document.body.style.filter = 'none';
      overlay.remove();
    });
  }
}

// Handle individual images and videos
function processMediaElement(element) {
  if (!settings.enabled || isWhitelisted() || processedElements.has(element)) {
    return;
  }

  processedElements.add(element);
  
  // Create a canvas to analyze the media
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  element.addEventListener('load', async () => {
    if (!nsfwFilter || !nsfwFilter.initialized) return;
    
    try {
      canvas.width = element.naturalWidth || element.videoWidth || 300;
      canvas.height = element.naturalHeight || element.videoHeight || 200;
      ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
      
      const predictions = await nsfwFilter.classifyImage(canvas);
      const nsfwScore = nsfwFilter.getNSFWScore(predictions);
      
      if (nsfwScore >= settings.sensitivity) {
        applyAction(element);
      }
    } catch (error) {
      console.error('Error processing media:', error);
    }
  });

  // For videos, also check periodically
  if (element.tagName === 'VIDEO') {
    element.addEventListener('play', () => {
      setInterval(async () => {
        if (element.paused || !nsfwFilter || !nsfwFilter.initialized) return;
        
        try {
          canvas.width = element.videoWidth;
          canvas.height = element.videoHeight;
          ctx.drawImage(element, 0, 0, canvas.width, canvas.height);
          
          const predictions = await nsfwFilter.classifyImage(canvas);
          const nsfwScore = nsfwFilter.getNSFWScore(predictions);
          
          if (nsfwScore >= settings.sensitivity && !processedElements.has(element)) {
            applyAction(element);
          }
        } catch (error) {
          console.error('Error processing video frame:', error);
        }
      }, 3000); // Check every 3 seconds
    });
  }
}

function applyAction(element) {
  if (settings.action === 'remove') {
    element.style.display = 'none';
    element.hidden = true;
  } else {
    element.style.filter = 'blur(50px)';
    element.style.pointerEvents = 'none';
    
    // Add click to reveal
    element.addEventListener('click', () => {
      element.style.filter = 'none';
    }, { once: true });
  }
}

// Set up mutation observer to watch for new media elements
function setupObserver() {
  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'IMG') {
            processMediaElement(node);
          } else if (node.tagName === 'VIDEO') {
            processMediaElement(node);
          }
          
          // Check children
          const images = node.querySelectorAll?.('img') || [];
          const videos = node.querySelectorAll?.('video') || [];
          images.forEach(processMediaElement);
          videos.forEach(processMediaElement);
        }
      });
    });
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });
}

// Initialize
async function init() {
  await loadSettings();
  
  // Check keyword blocking first
  if (checkKeywordBlocking() && !isWhitelisted()) {
    blockPage();
    return;
  }
  
  if (isWhitelisted() || !settings.enabled) {
    return;
  }

  // Load NSFW filter
  try {
    const { NSFWFilter } = await import(chrome.runtime.getURL('src/nsfw-filter.js'));
    nsfwFilter = new NSFWFilter();
    await nsfwFilter.initialize();
  } catch (error) {
    console.error('Failed to load NSFW filter:', error);
  }

  // Process existing media
  document.querySelectorAll('img, video').forEach(processMediaElement);

  // Watch for new media
  if (document.body) {
    setupObserver();
  } else {
    document.addEventListener('DOMContentLoaded', setupObserver);
  }
}

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    loadSettings().then(() => {
      // Re-evaluate page if settings changed
      if (checkKeywordBlocking() && !isWhitelisted()) {
        blockPage();
      }
    });
  }
});

// Start initialization
init();

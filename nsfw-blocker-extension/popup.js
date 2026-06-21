// Popup script

let settings = {
  sensitivity: 0.7,
  action: 'blur',
  enabled: true,
  whitelist: [],
  blockedKeywords: [],
  passwordEnabled: false
};

// DOM Elements
const enabledToggle = document.getElementById('enabledToggle');
const sensitivitySlider = document.getElementById('sensitivity');
const sensitivityValue = document.getElementById('sensitivityValue');
const actionSelect = document.getElementById('actionSelect');
const whitelistInput = document.getElementById('whitelistInput');
const addWhitelistBtn = document.getElementById('addWhitelistBtn');
const whitelistContainer = document.getElementById('whitelistContainer');
const keywordInput = document.getElementById('keywordInput');
const addKeywordBtn = document.getElementById('addKeywordBtn');
const keywordContainer = document.getElementById('keywordContainer');
const passwordToggle = document.getElementById('passwordToggle');
const passwordSection = document.getElementById('passwordSection');
const passwordInput = document.getElementById('passwordInput');
const setPasswordBtn = document.getElementById('setPasswordBtn');
const disablePasswordBtn = document.getElementById('disablePasswordBtn');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');

// Load settings on popup open
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['sensitivity', 'action', 'enabled', 'whitelist', 'blockedKeywords', 'passwordEnabled'], (result) => {
      settings = {
        sensitivity: result.sensitivity !== undefined ? result.sensitivity : 0.7,
        action: result.action || 'blur',
        enabled: result.enabled !== undefined ? result.enabled : true,
        whitelist: result.whitelist || [],
        blockedKeywords: result.blockedKeywords || [],
        passwordEnabled: result.passwordEnabled || false
      };
      
      // Update UI
      enabledToggle.checked = settings.enabled;
      sensitivitySlider.value = settings.sensitivity;
      sensitivityValue.textContent = settings.sensitivity.toFixed(2);
      actionSelect.value = settings.action;
      passwordToggle.checked = settings.passwordEnabled;
      
      if (settings.passwordEnabled) {
        passwordSection.classList.remove('hidden');
      } else {
        passwordSection.classList.add('hidden');
      }
      
      renderWhitelist();
      renderKeywords();
      updateStatus();
      
      resolve(settings);
    });
  });
}

// Save settings
async function saveSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.set({
      sensitivity: settings.sensitivity,
      action: settings.action,
      enabled: settings.enabled,
      whitelist: settings.whitelist,
      blockedKeywords: settings.blockedKeywords
    }, () => {
      resolve();
    });
  });
}

// Update status indicator
function updateStatus() {
  if (settings.enabled) {
    statusIndicator.className = 'status-indicator status-active';
    statusText.textContent = 'Protection Active';
  } else {
    statusIndicator.className = 'status-indicator status-inactive';
    statusText.textContent = 'Protection Disabled';
  }
}

// Render whitelist
function renderWhitelist() {
  whitelistContainer.innerHTML = '';
  settings.whitelist.forEach((domain, index) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <span style="font-size: 12px;">${domain}</span>
      <button class="remove-btn" data-index="${index}" data-type="whitelist">Remove</button>
    `;
    whitelistContainer.appendChild(item);
  });
  
  // Add event listeners to remove buttons
  whitelistContainer.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      settings.whitelist.splice(index, 1);
      saveSettings().then(renderWhitelist);
    });
  });
}

// Render keywords
function renderKeywords() {
  keywordContainer.innerHTML = '';
  settings.blockedKeywords.forEach((keyword, index) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <span style="font-size: 12px;">${keyword}</span>
      <button class="remove-btn" data-index="${index}" data-type="keyword">Remove</button>
    `;
    keywordContainer.appendChild(item);
  });
  
  // Add event listeners to remove buttons
  keywordContainer.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      settings.blockedKeywords.splice(index, 1);
      saveSettings().then(renderKeywords);
    });
  });
}

// Event Listeners
enabledToggle.addEventListener('change', async () => {
  settings.enabled = enabledToggle.checked;
  await saveSettings();
  updateStatus();
});

sensitivitySlider.addEventListener('input', () => {
  settings.sensitivity = parseFloat(sensitivitySlider.value);
  sensitivityValue.textContent = settings.sensitivity.toFixed(2);
});

sensitivitySlider.addEventListener('change', saveSettings);

actionSelect.addEventListener('change', async () => {
  settings.action = actionSelect.value;
  await saveSettings();
});

addWhitelistBtn.addEventListener('click', async () => {
  const domain = whitelistInput.value.trim().toLowerCase();
  if (domain && !settings.whitelist.includes(domain)) {
    settings.whitelist.push(domain);
    whitelistInput.value = '';
    await saveSettings();
    renderWhitelist();
  }
});

addKeywordBtn.addEventListener('click', async () => {
  const keyword = keywordInput.value.trim();
  if (keyword && !settings.blockedKeywords.includes(keyword)) {
    settings.blockedKeywords.push(keyword);
    keywordInput.value = '';
    await saveSettings();
    renderKeywords();
  }
});

passwordToggle.addEventListener('change', async () => {
  settings.passwordEnabled = passwordToggle.checked;
  if (passwordToggle.checked) {
    passwordSection.classList.remove('hidden');
  } else {
    // Disable password protection
    chrome.runtime.sendMessage({ action: 'disablePassword' }, () => {
      settings.passwordEnabled = false;
      passwordSection.classList.add('hidden');
      saveSettings();
    });
  }
});

setPasswordBtn.addEventListener('click', async () => {
  const password = passwordInput.value;
  if (password.length < 4) {
    alert('Password must be at least 4 characters');
    return;
  }
  
  chrome.runtime.sendMessage({ action: 'setPassword', password }, (response) => {
    if (response.success) {
      settings.passwordEnabled = true;
      passwordInput.value = '';
      saveSettings();
      alert('Password set successfully!');
    }
  });
});

disablePasswordBtn.addEventListener('click', async () => {
  chrome.runtime.sendMessage({ action: 'disablePassword' }, () => {
    settings.passwordEnabled = false;
    passwordToggle.checked = false;
    passwordSection.classList.add('hidden');
    saveSettings();
  });
});

// Initialize
loadSettings();

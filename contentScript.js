function log(...args) { console.log('[autotemp]', ...args); }
log('content script loaded');

(function() {
  const KEY = 'tempMode';
  const browserStorage = (typeof browser !== 'undefined' && browser.storage) ? browser.storage : null;
  const storage = browserStorage || chrome.storage;

  function getStoredState() {
    if (browserStorage) {
      return browserStorage.local.get(KEY);
    }
    return new Promise(resolve => storage.local.get(KEY, resolve));
  }

  function findToggle() {
    log('searching toggle');
    const el = document.querySelector('#conversation-header-actions button[aria-label*="temporary chat"]') ||
              Array.from(document.querySelectorAll('button, input')).find(el =>
                /temporary/i.test(el.textContent || '') ||
                /temporary/i.test(el.getAttribute('aria-label') || '')
              );
    if (el) log('toggle found', el);
    return el;
  }

  function isOn(el) {
    return el.getAttribute('aria-label') === 'Turn off temporary chat' ||
           el.getAttribute('aria-pressed') === 'true' ||
           el.getAttribute('aria-checked') === 'true' ||
           el.classList.contains('active') ||
           (el.checked === true);
  }

  function storeState(on) {
    log('storeState', on);
    storage.local.set({ [KEY]: on });
  }

  async function applyState(el) {
    const { tempMode } = await getStoredState();
    const enabled = Boolean(tempMode);
    log('retrieved state', enabled);
    if (enabled && el && !isOn(el)) {
      log('click toggle to enable');
      el.click();
    } else {
      log('toggle already enabled');
    }
  }

  function initWithToggle(el) {
    log('applyState');
    applyState(el);
    if (!el._autotemp_bound) {
      log('bind click');
      el._autotemp_bound = true;
      el.addEventListener('click', () => setTimeout(() => storeState(isOn(el)), 50));
    }
  }

  const observer = new MutationObserver(() => {
    log('DOM changed');
    const toggle = findToggle();
    if (toggle) {
      initWithToggle(toggle);
    } else {
      log('toggle not found after DOM change');
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Initial run in case the toggle is already present
  const initialToggle = findToggle();
  if (initialToggle) {
    initWithToggle(initialToggle);
  }
})();

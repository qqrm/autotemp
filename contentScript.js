function log(...args) { console.log('[autotemp]', ...args); }
log('content script loaded');

(function() {
  const KEY = 'tempMode';
  const storage = (typeof browser !== 'undefined' && browser.storage) ? browser.storage : chrome.storage;

  function findToggle() {
    log('searching toggle');
    const candidates = Array.from(document.querySelectorAll('button, input'));
    const el = candidates.find(el => /temporary/i.test(el.textContent || '') || /temporary/i.test(el.getAttribute('aria-label') || ''));
    if (el) log('toggle found', el);
    return el;
  }

  function isOn(el) {
    return el.getAttribute('aria-pressed') === 'true' ||
           el.getAttribute('aria-checked') === 'true' ||
           el.classList.contains('active') ||
           (el.checked === true);
  }

  function storeState(on) {
    log('storeState', on);
    storage.local.set({ [KEY]: on });
  }

  function applyState(el) {
    storage.local.get(KEY).then(({ tempMode }) => {
      const enabled = Boolean(tempMode);
      log('retrieved state', enabled);
      if (enabled && el && !isOn(el)) {
        log('click toggle to enable');
        el.click();
      } else {
        log('toggle already enabled');
      }
    });
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

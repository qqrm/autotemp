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
    storage.local.set({ [KEY]: on });
  }

  function applyState(el) {
    storage.local.get(KEY).then(({ tempMode }) => {
      const enabled = Boolean(tempMode);
      if (enabled && el && !isOn(el)) {
        el.click();
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
    const toggle = findToggle();
    if (toggle) {
      initWithToggle(toggle);
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Initial run in case the toggle is already present
  const initialToggle = findToggle();
  if (initialToggle) {
    initWithToggle(initialToggle);
  }
})();

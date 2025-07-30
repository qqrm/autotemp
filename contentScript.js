(function() {
  const KEY = 'tempMode';

  function findToggle() {
    const candidates = Array.from(document.querySelectorAll('button, input'));
    return candidates.find(el => /temporary/i.test(el.textContent || '') || /temporary/i.test(el.getAttribute('aria-label') || ''));
  }

  function isOn(el) {
    return el.getAttribute('aria-pressed') === 'true' ||
           el.getAttribute('aria-checked') === 'true' ||
           el.classList.contains('active') ||
           (el.checked === true);
  }

  function storeState(on) {
    browser.storage.local.set({ [KEY]: on });
  }

  function applyState(el) {
    browser.storage.local.get(KEY).then(({ tempMode }) => {
      const enabled = Boolean(tempMode);
      if (enabled && el && !isOn(el)) {
        el.click();
      }
    });
  }

  function initWithToggle(el) {
    applyState(el);
    if (!el._autotemp_bound) {
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

function log(...args) { console.log('[autotemp]', ...args); }
log('контент-скрипт загружен');

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
    log('ищем переключатель временного чата');
    const el = document.querySelector('#conversation-header-actions button[aria-label*="temporary chat"]') ||
              Array.from(document.querySelectorAll('button, input')).find(el =>
                /temporary/i.test(el.textContent || '') ||
                /temporary/i.test(el.getAttribute('aria-label') || '')
              );
    if (el) log('переключатель найден', el);
    return el;
  }

  // ChatGPT surfaces a site-level temporary mode indicator via a cookie and
  // mirrors the state in a `data-temporary-mode` attribute on `<body>`. This is
  // more reliable than inspecting the toggle itself since the button's DOM can
  // change across releases.  We check those indicators first and only fall back
  // to the previous heuristics if they're absent.
  function siteTempMode() {
    const body = document.body;
    if (body && body.dataset) {
      const attr = body.dataset.temporaryMode;
      if (attr === 'true' || attr === 'enabled') return true;
      if (attr === 'false' || attr === 'disabled') return false;
    }
    const match = document.cookie.match(/(?:^|; )oai-temporary-mode=(true|false)/);
    if (match) return match[1] === 'true';
    return null; // unknown
  }

  function isOn(el) {
    const site = siteTempMode();
    if (typeof site === 'boolean') return site;
    return el.getAttribute('aria-label') === 'Turn off temporary chat' ||
           el.getAttribute('aria-pressed') === 'true' ||
           el.getAttribute('aria-checked') === 'true' ||
           el.classList.contains('active') ||
           (el.checked === true);
  }

  function storeState(on) {
    log('сохраняем состояние', on);
    if (browserStorage) {
      browserStorage.local.set({ [KEY]: on }).then(
        () => log('состояние успешно сохранено'),
        err => log('не удалось сохранить состояние', err)
      );
    } else {
      storage.local.set({ [KEY]: on }, () => {
        const err = chrome.runtime.lastError;
        if (err) {
          log('не удалось сохранить состояние', err);
        } else {
          log('состояние успешно сохранено');
        }
      });
    }
  }

  function emulateClick(el) {
    ['mousedown', 'mouseup', 'click'].forEach(type =>
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }))
    );
  }

  async function applyState(el) {
    const { tempMode } = await getStoredState();
    const enabled = Boolean(tempMode);
    log('получено сохранённое состояние', enabled);
    if (enabled && el && !isOn(el)) {
      log('включаем временный чат');
      emulateClick(el);
    } else {
      log('переключатель уже в нужном состоянии');
    }
  }

  function initWithToggle(el) {
    log('применяем сохранённое состояние');
    applyState(el);
    if (!el._autotemp_bound) {
      log('подписываемся на нажатие переключателя');
      el._autotemp_bound = true;
      el.addEventListener(
        'click',
        () => {
          log('пользователь нажал переключатель временного чата');
          const observer = new MutationObserver(() => {
            storeState(isOn(el));
            observer.disconnect();
          });
          observer.observe(el, {
            attributes: true,
            attributeFilter: ['aria-pressed', 'aria-checked', 'class'],
          });
        },
        { capture: true }
      );
    }
  }

  const observer = new MutationObserver(() => {
    log('DOM изменился');
    const toggle = findToggle();
    if (toggle) {
      initWithToggle(toggle);
    } else {
      log('после изменения DOM переключатель не найден');
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Initial run in case the toggle is already present
  const initialToggle = findToggle();
  if (initialToggle) {
    initWithToggle(initialToggle);
  }

  // Track clicks on "New chat" to reapply state
  document.addEventListener(
    'click',
    event => {
      const newChat = event.target.closest('a[aria-label="New chat"], button[aria-label="New chat"]');
      if (newChat) {
        log('пользователь нажал «Новый чат»');
        setTimeout(() => {
          const toggle = findToggle();
          if (toggle) {
            log('применяем состояние к новому чату');
            initWithToggle(toggle);
          } else {
            log('не удалось найти переключатель после создания нового чата');
          }
        }, 0);
      }
    },
    true
  );
})();

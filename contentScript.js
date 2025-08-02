function log(...args) { console.log('[autotemp]', ...args); }
log('контент-скрипт загружен');

(function() {
  const KEY = 'tempMode';
  const browserStorage = (typeof browser !== 'undefined' && browser.storage) ? browser.storage : null;
  const storage = browserStorage || chrome.storage;

  // Configuration for multilingual environments. Users can extend these
  // patterns via `window.autotempConfig` before the script loads.
  const DEFAULT_LABELS = {
    tempToggle: [/temporary/i, /временн/i],
    tempToggleOff: [/turn off temporary/i, /выключить временн/i],
    newChat: [/new chat/i, /новый чат/i],
  };
  const USER_LABELS = (typeof window !== 'undefined' && window.autotempConfig) || {};
  const LABELS = {
    tempToggle: USER_LABELS.tempToggle || DEFAULT_LABELS.tempToggle,
    tempToggleOff: USER_LABELS.tempToggleOff || DEFAULT_LABELS.tempToggleOff,
    newChat: USER_LABELS.newChat || DEFAULT_LABELS.newChat,
  };

  function getStoredState() {
    if (browserStorage) {
      return browserStorage.local.get(KEY);
    }
    return new Promise(resolve => storage.local.get(KEY, resolve));
  }

  function findToggle() {
    log('ищем переключатель временного чата');
    // Prefer stable attributes over localized text.
    const stableSelectors = [
      '#conversation-header-actions [data-testid="temporary-mode-toggle"]',
      '#conversation-header-actions [data-testid="temp-mode-toggle"]',
      '#conversation-header-actions button[role="switch"]',
    ];
    for (const selector of stableSelectors) {
      const found = document.querySelector(selector);
      if (found) {
        log('переключатель найден по селектору', selector);
        return found;
      }
    }
    // Fallback to multilingual pattern matching.
    const el = Array.from(document.querySelectorAll('button, input')).find(el =>
      LABELS.tempToggle.some(rx =>
        rx.test(el.textContent || '') || rx.test(el.getAttribute('aria-label') || '')
      )
    );
    if (el) log('переключатель найден через текст', el);
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
    return LABELS.tempToggleOff.some(rx => rx.test(el.getAttribute('aria-label') || '')) ||
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

  async function initWithToggle(el) {
    log('применяем сохранённое состояние');
    try {
      await applyState(el);
    } catch (error) {
      log('ошибка при чтении сохранённого состояния', error);
    }
    if (!el._autotemp_bound) {
      log('подписываемся на нажатие переключателя');
      el._autotemp_bound = true;
      el.addEventListener(
        'click',
        () => {
          log('пользователь нажал переключатель временного чата');
          setTimeout(() => storeState(siteTempMode()), 0);
        },
        { capture: true }
      );
    }
  }

  if (document.body) {
    const bodyObserver = new MutationObserver(() => {
      log('атрибут data-temporary-mode изменился');
      storeState(siteTempMode());
    });
    bodyObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-temporary-mode'],
    });
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
      const selectors = ['a[data-testid="new-chat-button"]', 'button[data-testid="new-chat-button"]'];
      let newChat = null;
      for (const selector of selectors) {
        newChat = event.target.closest(selector);
        if (newChat) break;
      }
      if (!newChat) {
        const el = event.target.closest('a, button');
        const label = (el && (el.getAttribute('aria-label') || el.textContent)) || '';
        if (LABELS.newChat.some(rx => rx.test(label))) newChat = el;
      }
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

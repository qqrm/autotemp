// ChatGPT Auto-Temp (desktop+mobile) v2.1 — WebExtension build
(() => {
  'use strict';

  /* ——— Константы ——— */
  const ON_SELECTOR  = 'button[aria-label="Turn on temporary chat"]';
  const OFF_SELECTOR = 'button[aria-label="Turn off temporary chat"]';
  const STORAGE_KEY  = 'tempChatEnabled';
  const MAX_RETRIES  = 5;
  const RETRY_MS     = 300;

  /* ——— Логирование ——— */
  const DEBUG = false;
  const log   = (...a) => DEBUG && console.log('[AutoTemp]', ...a);

  /* ——— Хелперы хранилища ——— */
  const store = (chrome?.storage ?? browser.storage).local;

  const loadState = async () => {
    const obj = await store.get(STORAGE_KEY);
    return !!obj[STORAGE_KEY];
  };
  const saveState = (val) => {
    store.set({ [STORAGE_KEY]: val });
    log('Saved state:', val);
  };

  /* ——— DOM-утилиты ——— */
  const isTempActive = () => !!document.querySelector(OFF_SELECTOR);
  const findVisible  = (sel) =>
    [...document.querySelectorAll(sel)].find((el) => el.offsetParent && !el.disabled);

  /* ——— Лог кликов для отладки ——— */
  if (DEBUG) {
    const cssPath = (el) => {
      if (!el) return '';
      if (el.dataset?.testid)          return `${el.tagName.toLowerCase()}[data-testid="${el.dataset.testid}"]`;
      if (el.getAttribute('aria-label')) return `${el.tagName.toLowerCase()}[aria-label="${el.getAttribute('aria-label')}"]`;
      const cls = [...el.classList].slice(0, 3).join('.');
      return cls ? `${el.tagName.toLowerCase()}.${cls}` : el.tagName.toLowerCase();
    };
    document.addEventListener(
      'click',
      (e) => e.isTrusted && console.log('[CLICK]', cssPath(e.target.closest('*'))),
      true
    );
  }

  /* ——— Основная логика ——— */
  let retries = 0;
  let tempChatEnabled = false;

  const enableTemp = () => {
    if (!tempChatEnabled || isTempActive()) { retries = 0; return; }

    const btn = findVisible(ON_SELECTOR);
    if (!btn) return;            // кнопка ещё не появилась

    btn.click();
    log('⚡️ Auto-clicked ON');

    setTimeout(() => {
      if (isTempActive()) {
        log('✅ Temporary Chat включён');
        retries = 0;
      } else if (++retries <= MAX_RETRIES) {
        log(`🔄 Повтор ${retries}`);
        enableTemp();
      } else {
        log('❌ Не удалось включить после 5 попыток');
        retries = 0;
      }
    }, RETRY_MS);
  };

  /* ——— Реагируем на ручное on/off ——— */
  document.addEventListener(
    'click',
    (e) => {
      if (!e.isTrusted) return;
      if (e.target.closest(ON_SELECTOR))  { saveState(true);  tempChatEnabled = true;  }
      if (e.target.closest(OFF_SELECTOR)) { saveState(false); tempChatEnabled = false; }
    },
    true
  );

  /* ——— Наблюдаем DOM + смены URL ——— */
  const mo = new MutationObserver(enableTemp);
  mo.observe(document.body, { childList: true, subtree: true });

  let lastURL = location.pathname + location.search;
  setInterval(() => {
    const cur = location.pathname + location.search;
    if (cur !== lastURL) { lastURL = cur; retries = 0; enableTemp(); }
  }, 100);

  /* ——— Старт ——— */
  loadState().then((flag) => {
    tempChatEnabled = flag;
    enableTemp();
    log('🟢 AutoTemp loaded. tempChatEnabled =', tempChatEnabled);
  });
})();

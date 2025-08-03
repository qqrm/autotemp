(async () => {
  'use strict';

  /* ——————————— UI selectors ——————————— */
  const NEW_CHAT_SELECTOR = 'a[href="/"], button[aria-label="New chat"]';
  const ON_SELECTOR  = 'button[aria-label="Turn on temporary chat"]';
  const OFF_SELECTOR = 'button[aria-label="Turn off temporary chat"]';

  /* ——————————— Storage helpers ——————————— */
  const STORAGE_KEY = 'tempChatEnabled';
  const storageAPI  = chrome?.storage?.local ?? (typeof browser !== 'undefined' ? browser.storage.local : null);

  const loadFlag = () =>
    new Promise((resolve) => {
      if (storageAPI) storageAPI.get([STORAGE_KEY], (res) => resolve(Boolean(res?.[STORAGE_KEY])));
      else            resolve(Boolean(localStorage.getItem(STORAGE_KEY)));
    });

  const saveFlag = (val) => {
    if (storageAPI) storageAPI.set({ [STORAGE_KEY]: val });
    else            localStorage.setItem(STORAGE_KEY, val ? '1' : '');
    log('Saved state:', val);
  };

  /* ——————————— Logging ——————————— */
  const DEBUG = false;                  // flip to false to silence console
  const log   = (...a) => DEBUG && console.log('[AutoTemp]', ...a);

  /* ——————————— DOM helpers ——————————— */
  const isTempActive = () => !!document.querySelector(OFF_SELECTOR);
  const findVisible  = (sel) =>
    [...document.querySelectorAll(sel)].find((el) => el.offsetParent !== null && !el.disabled);

  /* ——————————— Main auto-enable routine ——————————— */
  const MAX_TRIES   = 30;
  const RETRY_DELAY = 400; // ms

  let tempChatEnabled = await loadFlag();
  log('🟢 AutoTemp loaded. tempChatEnabled =', tempChatEnabled);

  const enableTempChat = () => {
    if (!tempChatEnabled || isTempActive()) return; // ничего делать не надо

    let tries = 0;
    const attempt = () => {
      const btn = findVisible(ON_SELECTOR);
      if (btn) {
        btn.click();
        setTimeout(() => {
          if (isTempActive()) {
            saveFlag(true);
            log('✅ Turned ON temporary chat (confirmed)');
          } else if (++tries < MAX_TRIES) {
            log('🔄 Clicked but not active, retry', tries);
            attempt();
          } else {
            log('❌ Gave up after', MAX_TRIES, 'tries');
          }
        }, 250);
      } else if (++tries < MAX_TRIES) {
        setTimeout(attempt, RETRY_DELAY);
      } else {
        log('❌ Button not found after', MAX_TRIES, 'tries');
      }
    };
    attempt();
  };

  /* ——————————— Persist user toggles ——————————— */
  document.addEventListener(
    'click',
    (e) => {
      if (!e.isTrusted) return; // игнорируем синтетику
      if (e.target.closest(ON_SELECTOR))  return saveFlag(true);
      if (e.target.closest(OFF_SELECTOR)) return saveFlag(false);
    },
    true
  );

  /* ——————————— Hook “new chat” events ——————————— */
  const onNewChat = () => enableTempChat();

  document.addEventListener(
    'click',
    (e) => {
      if (e.target.closest(NEW_CHAT_SELECTOR)) onNewChat();
    },
    true
  );
  window.addEventListener('popstate', onNewChat); // SPA-переходы
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'n') onNewChat();
  });

  /* ——————————— First-load sync ——————————— */
  if (tempChatEnabled && !isTempActive()) enableTempChat();
})();

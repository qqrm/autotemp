(function() {
    const NEW_CHAT_SELECTOR = 'a[href="/"]';
    const TEMP_CHAT_ON_SELECTOR = 'button[aria-label="Turn on temporary chat"]';
    const TEMP_CHAT_OFF_SELECTOR = 'button[aria-label="Turn off temporary chat"]';
    const STORAGE_KEY = 'tempChatEnabled';

    let tempChatEnabled = false;
    const storage = chrome?.storage ?? (typeof browser !== 'undefined' ? browser.storage : null);

    function log(...args) {
        console.log('[AutoTemp]', ...args);
    }

    function loadState(cb) {
        if (storage) {
            storage.local.get([STORAGE_KEY], (res) => {
                tempChatEnabled = Boolean(res && res[STORAGE_KEY]);
                log('Загружено состояние:', tempChatEnabled);
                if (cb) cb();
            });
        } else {
            tempChatEnabled = !!localStorage.getItem(STORAGE_KEY);
            log('Загружено состояние из localStorage:', tempChatEnabled);
            if (cb) cb();
        }
    }

    function saveState(state) {
        if (storage) {
            storage.local.set({ [STORAGE_KEY]: state });
            log('Сохранили состояние:', state);
        } else {
            localStorage.setItem(STORAGE_KEY, state ? '1' : '');
            log('Сохранили состояние в localStorage:', state);
        }
    }

    function isTemporaryChatActive() {
        const btn = document.querySelector(TEMP_CHAT_OFF_SELECTOR);
        const on = !!btn;
        log('isTemporaryChatActive (по кнопке):', on);
        return on;
    }

    // === retrier-кликер, который несколько раз подряд пробует кликнуть кнопку "Временный чат" ===
    function clickTemporaryChatRetrier(maxTries = 10, delay = 400) {
        let tries = 0;
        function tryClick() {
            if (!tempChatEnabled) return;
            const btn = document.querySelector(TEMP_CHAT_ON_SELECTOR);
            if (btn) {
                btn.click();
                log('Автоматический клик по кнопке "Временный чат" (ретрайер)!');
            } else if (++tries < maxTries) {
                setTimeout(tryClick, delay);
            } else {
                log('Не удалось найти кнопку "Временный чат" после создания нового чата.');
            }
        }
        tryClick();
    }

    // Реакция на клик по "Новый чат"
    function setupGlobalClickListener() {
        document.addEventListener('click', function (e) {
            const target = e.target.closest(NEW_CHAT_SELECTOR);
            if (target && tempChatEnabled) {
                setTimeout(() => {
                    clickTemporaryChatRetrier();
                }, 200);
            }
        }, true);
    }

    // Реакция на клик по кнопке временного чата (сохранить выбор)
    document.addEventListener('click', function(e) {
        const btn = e.target.closest(TEMP_CHAT_ON_SELECTOR + ',' + TEMP_CHAT_OFF_SELECTOR);
        if (btn) {
            setTimeout(() => {
                const active = isTemporaryChatActive();
                tempChatEnabled = active;
                saveState(active);
                log('Пользовательский выбор режима:', active ? 'Временный' : 'Обычный');
            }, 200);
        }
    }, true);

    // Навешиватель слушателя (если кнопка появляется не сразу)
    function mutationWatcherForNewChatButton() {
        let watcherActive = false;
        function attachIfPossible() {
            if (!document.querySelector(NEW_CHAT_SELECTOR)) return;
            if (!watcherActive) {
                log('Глобальный слушатель кликов по "Новый чат" навешан.');
                setupGlobalClickListener();
                watcherActive = true;
            }
        }
        // на всякий случай пытаемся сразу
        attachIfPossible();
        // и следим за DOM
        const observer = new MutationObserver(attachIfPossible);
        observer.observe(document.body, { childList: true, subtree: true });
    }

    loadState(() => {
        mutationWatcherForNewChatButton();
    });

    log('✅ AutoTemp: автоприменение временного чата включено (с ретрайером)!');
})();

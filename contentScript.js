(function() {
    const NEW_CHAT_SELECTOR = 'a[href="/"]';
    const TEMP_CHAT_SELECTOR = 'button[aria-label="Turn on temporary chat"]';
    const STORAGE_KEY = 'tempChatEnabled';

    let tempChatEnabled = false;
    const storage = chrome.storage || (typeof browser !== 'undefined' ? browser.storage : null);

    function loadState() {
        const getter = storage ? storage.local.get : (key, cb) => cb({});
        getter.call(storage ? storage.local : null, [STORAGE_KEY], (res) => {
            tempChatEnabled = Boolean(res && res[STORAGE_KEY]);
            if (tempChatEnabled) {
                clickTemporaryChatWhenReady();
            }
        });
    }

    function saveState(state) {
        if (storage) {
            storage.local.set({ [STORAGE_KEY]: state });
        }
    }

    function clickTemporaryChatWhenReady() {
        if (!tempChatEnabled) return;
        let btn = document.querySelector(TEMP_CHAT_SELECTOR);
        if (btn) {
            btn.click();
            console.log('Клик по кнопке "Временный чат"!');
            return;
        }
        const observer = new MutationObserver(() => {
            btn = document.querySelector(TEMP_CHAT_SELECTOR);
            if (btn) {
                btn.click();
                console.log('Клик по кнопке "Временный чат" через Observer!');
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function isTemporaryChatActive() {
        const el = document.querySelector('[data-testid="temporary-chat-label"]');
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            el.getAttribute('aria-hidden') !== 'true'
        );
    }

    document.addEventListener('click', function(e) {
        const target = e.target.closest(NEW_CHAT_SELECTOR);
        if (target && tempChatEnabled) {
            clickTemporaryChatWhenReady();
        }
    }, true);

    document.addEventListener('click', function(e) {
        const btn = e.target.closest(TEMP_CHAT_SELECTOR);
        if (btn) {
            setTimeout(() => {
                const active = isTemporaryChatActive();
                tempChatEnabled = active;
                saveState(active);
                console.log(active ? 'Временный чат включён' : 'Обычный чат включён');
            }, 100);
        }
    }, true);

    loadState();
    console.log('✅ Автокликер временного чата активирован!');
})();

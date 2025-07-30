# AutoTemp Firefox Extension

This extension remembers whether you enabled ChatGPT's built‑in **Temporary** toggle. When you switch the toggle on, the setting is saved and automatically re‑applied for every new chat so you don't need to click it again. The state is stored in `browser.storage.local`.

## Development

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on** and select the `manifest.json` file from this folder.
3. The extension has no popup UI. Simply enable **Temporary** in the ChatGPT interface once – the extension will keep that choice for future chats.

The code follows basic Manifest V3 patterns and uses `browser.storage.local` to persist the toggle state.

Icons are not included in the repository to avoid committing binary assets. If desired, add your own icon files in an `icons/` directory and reference them from `manifest.json`.

# Persistent Temporary Chats Extension Specification

## Purpose
Ensure that the "temporary" state for chats is maintained for all newly created chats in ChatGPT until the user explicitly disables the mode.

## Core Requirements

1. **Global "Temporary Chat" Toggle**
   - A single click enables "temporary chat" mode.
   - Clicking again disables this mode.

2. **New Chat Behaviour**
   - If "temporary chat" mode is enabled, every new chat automatically becomes temporary with no extra actions.
   - If the mode is disabled, a new chat is created as normal (non-temporary).

3. **State Persistence Across Chats**
   - Once the mode is enabled, any number of subsequently created chats inherit the temporary status until the user disables the mode.
   - After the mode is turned off, all following chats are regular and do not carry the temporary state.

4. **Interaction with Existing Chat**
   - Activating the mode in the currently open chat makes that chat temporary.
   - Switching the mode should not affect any already existing chats, except the one where the switch occurs.

5. **State Indication**
   - The "temporary chat" button/icon must have clear visual indication:
     - **Mode On:** highlighted colour/icon showing "temporary mode ON".
     - **Mode Off:** standard appearance showing "temporary mode OFF".

6. **Persisting State in Local Storage**
   - The user's choice (enabled/disabled) is stored in `localStorage` so that the last state persists after page reloads or browser restarts.

7. **Compatibility**
   - The extension must not break existing chat creation process and other interface elements.
   - It should work correctly with an existing "temporary chat" button (if present) or add its own button.

8. **Fallback/Reset**
   - When the extension settings are reset or the extension is removed, default behaviour returns to standard (new chats are non-temporary).

## Implementation Notes

- **UI Events**
  - On clicking the "temporary chat" button:
    1. Determine the current state:
       - If `false`, switch to `true` and save to `localStorage`.
       - If `true`, switch to `false` and save to `localStorage`.
    2. Update the visual state of the button/icon.
    3. Apply or remove the temporary status for the current chat (if the site's API allows).

- **Hook on New Chat Creation**
  - Listen for events/DOM changes that indicate a new chat has been created.
  - After a new chat appears, check the global flag from `localStorage`:
    - If `true`, automatically make the chat temporary (call the appropriate API or simulate a click on the system button if implemented via DOM).
    - If `false`, do nothing (leave chat as normal).

- **Error Handling**
  - If the site changes DOM structure or API, the extension should gracefully catch and log the error without breaking the main functionality.
  - Provide fallback or disable functionality if site behaviour changes drastically.

## User Flow

1. User opens ChatGPT and loads the extension.
2. Clicks "temporary chat" button → mode enabled, current chat becomes temporary.
3. Creates a new chat → it is automatically temporary.
4. Clicks "temporary chat" again → mode disabled.
5. Creates another chat → it is created as normal.

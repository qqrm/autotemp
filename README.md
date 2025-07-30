# Temporary State Browser Extension

This project will eventually host a browser extension that stores temporary state for new chats.

## Packaging the Extension

The recommended tooling for packaging Firefox extensions is Mozilla's `web-ext` CLI.

### Prerequisites

- [Node.js](https://nodejs.org/) and `npm` installed.
- Install `web-ext` globally:

```bash
npm install --global web-ext
```

### Building a Package

From the root of this repository, run:

```bash
web-ext build
```

The command creates a `.zip` archive inside a `web-ext-artifacts` folder. To distribute as a Firefox add-on, rename the `.zip` file so it ends with `.xpi`.

## Installing in Firefox

1. Open Firefox and visit `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on** and choose the `.xpi` (or `.zip`) package generated above.
3. The extension loads for the current browser session. To install permanently, submit the `.xpi` to Mozilla Add-ons for signing.


## Automated Build and Release

A GitHub Actions workflow builds the extension whenever a tag starting with `v` is pushed. The pipeline uses `web-ext` to package the code and publishes the resulting `.xpi` file as an artifact of the corresponding GitHub Release. You can also trigger the workflow manually via the **Run workflow** button in the Actions tab.

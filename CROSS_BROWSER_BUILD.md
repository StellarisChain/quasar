# Cross-Browser Build Instructions

This extension now supports both Chrome and Firefox. Here's how to build for each browser:

## Building for Chrome (Manifest V3)

```bash
npm run build:chrome
```

This will create a build in `build/chrome/` with:
- Manifest V3 format
- Service worker for background scripts
- Chrome-specific permissions and APIs

## Building for Firefox (Manifest V2)

```bash
npm run build:firefox
```

This will create a build in `build/firefox/` with:
- Manifest V2 format (Firefox's preferred format)
- Background scripts instead of service workers
- Firefox-specific permissions and APIs
- Firefox extension ID for proper signing

## Building for All Browsers

```bash
npm run build:all
```

This will build for both Chrome and Firefox in their respective directories.

## Key Differences Between Browsers

### Manifest Format
- **Chrome**: Uses Manifest V3 with service workers
- **Firefox**: Uses Manifest V2 with background scripts

### API Differences
- **Chrome**: Uses `chrome.action` API
- **Firefox**: Uses `browser.browserAction` API (through polyfill)

### Permissions
- **Chrome**: More granular permission system
- **Firefox**: Broader permission requirements

## Testing

### Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `build/chrome/` directory

### Firefox
1. Open `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file in `build/firefox/`

## Distribution

### Chrome Web Store
Use the zip file generated at `zip/quasar-chrome-[version].zip`

### Firefox Add-ons (AMO)
Use the zip file generated at `zip/quasar-firefox-[version].zip`

Note: Firefox extensions need to be signed by Mozilla for distribution outside of temporary loading.

## Browser Compatibility Layer

The extension uses a compatibility layer (`src/lib/browser-compat.ts`) that:
- Automatically detects the browser environment
- Provides unified APIs that work across browsers
- Uses the webextension-polyfill for consistent Promise-based APIs
- Handles differences between Manifest V2 and V3

## Development

When developing, you can use the existing development server with:

```bash
npm start
```

This will build for Chrome by default. To develop for Firefox, set the environment variable:

```bash
TARGET_BROWSER=firefox npm start
```

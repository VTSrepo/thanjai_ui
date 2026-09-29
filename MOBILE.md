# Thanjai – Mobile app readiness

**Verdict:** the UI can be packaged as an Android/iOS app with **Capacitor** without a rewrite.
It is a React 19 single-page app with no server-side rendering, and it talks to the API over HTTPS with axios.

## Already prepared (this branch)

| Item | Status |
| --- | --- |
| Router base path configurable (`REACT_APP_ROUTER_BASENAME`, web = `/v1`, app = `/`) | Done |
| Asset paths use `PUBLIC_URL` (no hard-coded `/v1/...`) | Done |
| `npm run build:mobile` builds with relative assets for the app shell | Done |
| `viewport-fit=cover` + safe-area padding on sticky action bars (iPhone notch / home bar) | Done |
| Indent flow, Branch Master: phone-first cards, 42px+ touch targets, full-screen dialogs on phones | Done |
| `capacitor.config.json` (appId `com.thanjaicaterers.app` – change before first store upload) | Done |
| API URL is absolute in production `.env` (`https://pm.thanjaicaterers.com/v1`) | OK |

## Still to do before store release

1. **Remaining screens are table-based** (Product, User, Employee, Category, Timesheet, Production Monitor, Reports use MUI DataGrid).
   They work on phones but need horizontal scrolling. Convert to the same card layout as Indent/Branch.
2. **PDF export** (`utilities/fileHelper.js` → `doc.save`) does not download inside a WebView.
   Use `@capacitor/filesystem` + `@capacitor/share` when running natively.
3. **Security first** (see code review S1–S2): an app binary exposes the API URL to anyone, so login
   must use parameterised SQL and every API call must carry a token before the app is published.
4. **CORS**: if the API origin list is restricted, allow `https://localhost` (Android) and `capacitor://localhost` (iOS).
5. Session storage: `localStorage` works in the WebView; move to `@capacitor/preferences` for durability.
6. App icons and splash screens (generate from `public/logo512.png` with `@capacitor/assets`).

## Build steps (when ready)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npm run build:mobile          # builds ./build with relative paths and router base "/"
npx cap add android           # once
npx cap add ios               # once, needs a Mac with Xcode
npx cap sync                  # after every build:mobile
npx cap open android          # opens Android Studio to run / sign
```

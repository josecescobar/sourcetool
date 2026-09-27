# MOBILE_APP.md — SourceTool Mobile (React Native + Expo)

Expo SDK (dev-client builds via EAS; not Expo Go — camera perf needs config plugins), TypeScript, React Navigation, TanStack Query, Zustand, SQLite (expo-sqlite) for offline. Shares `packages/shared`, `packages/calc`, `packages/api-client` with web. iOS + Android from one codebase.

## Purpose hierarchy
This app is a **retail-arbitrage scanning weapon first**, a companion app second. Every design decision serves: *shelf → verdict in under 2 seconds, hundreds of times per store visit.* SellerAmp's Speed Mode is the benchmark; we ship its equivalent at launch, not as a follow-up.

## Screen map (React Navigation)
```
RootStack
├── AuthStack: Welcome, Login, Register
└── MainTabs
    ├── Scan (default tab)        # camera-first
    │   ├── ScanScreen            # continuous scanner + result cards overlay
    │   └── AnalysisScreen        # full panel stack for one ASIN
    ├── Search                    # omnibox: text / ASIN / paste URL; recent lookups
    ├── Lists                     # sourcing lists; ListDetail; quick "+qty" stepper rows
    ├── Trackers                  # tracker list + notification feed
    └── Profile                   # settings profiles, criteria editor, seller link status,
                                  # device/session mgmt, offline queue status, theme
```
Share-sheet intake (iOS Share Extension + Android intent-filter): share any Amazon URL/product from another app → deep-link `AnalysisScreen` (parity with SellerAmp's share-to-analyze).

## Barcode scanning flow (the core loop)
Scanner: `expo-camera` `CameraView.onBarcodeScanned` (EAN-13, EAN-8, UPC-A, UPC-E, Code-128). If frame-rate/low-light performance disappoints on mid-range Android, escalate to `react-native-vision-camera` + ML Kit — keep the scanner behind a `ScannerProvider` interface so the swap is one file.

**Speed Mode (default):**
1. Camera stays live continuously; torch toggle persistent.
2. Barcode hit → debounce (same code within 3s ignored) → haptic tick → **compact result card slides over bottom third; camera never stops.**
3. Card contents (from `GET /search?q={ean}` resolve → `/analysis`): image, title, verdict color band, profit @ default cost prompt, ROI, Max Cost (the number RA sellers actually need on the shelf), BSR + est. sales/mo, 90d sparkline, eligibility badge, flag icons (hazmat/PL/IP).
4. Card actions: cost-price quick-pad (recomputes locally via `packages/calc`, no round-trip) → [Add to list +qty] [Full analysis] [Dismiss/keep scanning]. New scan replaces card; last 20 scans in a swipeable stack.
5. Unknown barcode → card with "Not matched — search by title?" + manual entry.
Latency budget: scan→card p50 <1.2s, p95 <2s on 4G. Achieved by: single composite analysis call, quick-view payload first (progressive: mini card renders from `/quick-view`-shaped subset event, full verdict fills in), Redis-warm ASINs, HTTP/2 keep-alive, image thumbnails 128px.

**Single-scan mode:** classic — scan, freeze, full AnalysisScreen. Toggle persisted.

## AnalysisScreen
Same panel registry as web (panelIds shared; layout from SettingsProfile per-surface `mobile` key), rendered as FlatList of collapsible cards: quick-info (pinned header), calculator (native numeric pads), chart, offers, buy-box, alerts/risk, variations, product-info, notes/tags, lookup-history. Chart: `react-native-svg` custom step-line renderer fed by the same `/history` contract + shared chartTheme colors — NOT a WebView (cold-start cost); range buttons 1m/3m/1y/all (API enum 30d/90d/365d/all); tap-drag crosshair. Keep the renderer minimal (no zoom-pinch v1; range buttons only).

## Offline behavior (stores have dead zones)
Local SQLite mirrors, sync via TanStack Query persister + custom outbox:
- **Read cache:** last 500 analyses (composite JSON + 90d history) persisted; AnalysisScreen renders cached data with "offline — data as of X" banner.
- **Scan queue (outbox):** offline scans stored `{ean, ts, costEntered?, listId?}`; visible as "pending" cards; on reconnect, background sync resolves + analyzes each, fires local notification "12 scans resolved: 3 pass criteria", updates list items.
- **Lists:** full local mirror, mutations queued (last-write-wins on server; per-item `updatedAt` guard).
- **Calc engine works fully offline** — user can re-cost any cached analysis in-store.
- Criteria/profiles cached; verdict recomputation offline uses cached fees (flagged "estimate").
- Quota: offline lookups are charged at sync time (server has no backdating parameter — acceptable: quotas are hourly-rolling).

## Shared logic with web (monorepo contract)
| Package | Used for |
|---|---|
| `packages/shared` | Zod DTOs, PriceSeries enum, verdictColors, chartTheme, panel registry ids |
| `packages/calc` | full profit/fee/estimate engine — identical numbers on all surfaces (test asserts web/mobile parity on fixtures) |
| `packages/api-client` | typed client; RN fetch adapter; auth token refresh interceptor shared |
Screens/components are NOT shared (no react-native-web) — different interaction models deserve native implementations; only logic and contracts are shared. This is deliberate: attempts to share UI across RN/web historically cost more than they save at this app count.

## Push notifications
Expo Push. Tracker alerts (deep-link to AnalysisScreen), scan-queue sync results, quota warnings. Token registered via `PUT /me/push-tokens`. Notification settings per channel in Profile.

## Auth & device management
Login issues MOBILE deviceType session (plan device limits enforced server-side, SellerAmp-style). Refresh token in SecureStore; biometric unlock optional. 401-refresh-retry in api-client interceptor.

## AI Image Search (Phase 3)
Camera still → upload → `/resolve/image` → candidate ASINs w/ confidence → tap to analyze. UI slot reserved in ScanScreen mode-switcher (Barcode | Photo) from day one; ships stubbed-hidden until backend ready.

## Performance & platform notes
- Hermes on; RN new architecture on from start (avoid migration later).
- FlashList over FlatList for lists/history feeds.
- Image caching: expo-image w/ disk cache.
- Cold start target <2.5s to camera-ready on mid-range Android; defer non-scan tab mounting.
- EAS Update (OTA) for JS-only fixes; store builds weekly max.

## Testing
- Jest unit: outbox reducer, sync reconciliation, calc parity fixture test.
- Maestro E2E: login → mock-camera scan event → card renders → add to list → offline toggle → queue → sync.
- Manual device matrix: iPhone SE-class, Pixel mid-range, low-light scan bench (SellerAmp handles partially visible barcodes — that's the bar; ML Kit path if expo-camera misses it).

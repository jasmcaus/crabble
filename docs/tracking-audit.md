# Tracking & telemetry audit

Audit of everything the extension sends off the device for analytics, metrics or
bug tracking, and what to do with each in Crabble. Plan only; nothing has been
stripped yet. About 109 files under `src/` call one of these channels.

## How it is gated today

A single preference, `userDataTrackingOptOut`, gates **GA4, Matomo, festats
and Sentry** (`src/utils/user-data-tracking.ts:14`). In practice it is opt-out
and users get opted in without being asked:

- Onboarding forces it on for every new user:
  `src/ui/views/NewUserImport/PasswordCard.tsx:144` calls
  `setUserDataTrackingOptOut(false)` on submit.
- Upgraded installs with no value are opted in:
  `src/background/service/preference.ts:398`.
- The only way out is the Settings switch
  (`src/ui/views/Dashboard/components/Settings/index.tsx:1152`).

Everything in sections 5–7 below ignores this preference entirely.

## Strip completely

| # | Channel | Destination | What it sends | Identifier |
|---|---|---|---|---|
| 1 | **Google Analytics 4**: `src/utils/ga4.ts` (~41 files) | `www.google-analytics.com/mp/collect` (Measurement ID and API secret hard-coded at `ga4.ts:9-10`) | Connected dApp **origins** (`background/controller/provider/rpcFlow.ts:191`, `internalMethod.ts:59`), a daily ping with keyring types bucketed by empty/non-empty balance (`background/index.ts:338-397`), toolbar pin state (`index.ts:660`), unlock method, import type, sign/submit funnel, settings toggles, rating stars | Per-install `clientId` UUID in `storage.local` (`ga4.ts:26`), plus extension version |
| 2 | **Matomo**: `src/utils/matomo-request.ts` (~48 files) | `matomo.debank.com` (`matomo-request.ts:5`) | Current page path on every event, daily pinned chains, custom-network count, keyring/balance buckets (`background/index.ts:343-386`), **dApp search terms** (`ui/views/DappSearch/index.tsx:147`), **connected dApp origins** (`ui/views/Dashboard/components/RecentConnections/index.tsx:53,72`), settings, send/receive, security toggles | Per-install 16-hex `extensionId` in `storage.local` (`matomo-request.ts:17`) |
| 3 | **DeBank festats**: `src/stats.ts` + `@debank/festats` (~39 files) | `festats.debank.com/rabby/<event>?…` (GET; all params in the URL) | Transaction funnel per chain and keyring type, plus pre-exec result (`rpcFlow.ts:627`, `provider/controller.ts:1120`, `service/transactionHistory.ts:1306`). **Perps trades with the wallet address**, coin, size, price and leverage (`perpsTradeHistory`, 25 call sites, e.g. `ui/views/Perps/popup/OpenPositionPopup.tsx:382`). **Tx hashes** for DeFi actions (`CommonPopup/AssetList/components/DappActions/index.tsx:224`). Swap/bridge quote results, sign-page render time | The wallet address itself (perps), tx hashes |
| 4 | **Uninstall URL**: `src/background/service/uninstalled.ts:122` | Opens `rabby.io/uninstalled?r=<iwtl>&v=<version>&lang=` when Crabble is removed | Flags for imported / has wallet / has sent a tx / has a local key | None, but **not gated** by the opt-out, and it sends Crabble users to Rabby's site |
| 5 | **Security-engine rule logs**: `openapi.postActionLog` | `api.rabby.io` | Which risk rules fired for each signing request, keyed by the pre-exec log id (`ui/views/Approval/components/SignTx.tsx:2308`, `SignTypedData.tsx:829`, `SignText.tsx:432`) | Log id that the server already ties to the tx. **Not gated** |
| 6 | **Rating prompt**: `src/ui/component/RateModal` | `api.rabby.io/v1/feedback` and Rabby's Chrome Web Store listing | Free-text feedback (`RateModal/hooks.ts:270`), which is also copied into Sentry `extra` (`hooks.ts:280`), plus GA4 rate events | **Not gated** |
| 7 | **Screenshot feedback**: `wallet.postUserFeedback` | `api.rabby.io` (Rabby's support team) | User-written text and screenshot, plus **silently attached** first address, first imported address and address counts (`background/controller/wallet.ts:7169`, addresses around `:7216`, upload at `:7270`) | Wallet addresses. User-initiated, but it goes to a team that doesn't support Crabble |

Why strip: 1–3 are pure product analytics for DeBank/Rabby. Crabble can't read
any of that data, the users get nothing back for it, and 1–3 leak browsing
(dApp origins, search terms) and trading activity tied to addresses or stable
install IDs. 4–7 point Crabble users and their data at Rabby's infrastructure
and team. If Crabble wants feedback, replace 6–7 with a link to its own issue
tracker.

Dependencies this frees: `@debank/festats`. (`nanoid` and `uuid` are used
elsewhere, so they stay.)

## Keep, but change

| # | Channel | Recommendation |
|---|---|---|
| 8 | **Sentry**: `@sentry/browser` / `@sentry/react`, initialised at `background/index.ts:121` and `ui/app.tsx:27`, config in `src/utils/sentry-config.ts`, ~42 files call `captureException`/`captureMessage` | This is the only channel that helps **you** fix bugs (hardware-signing diagnostics, bootstrap timeouts). It already scrubs a lot (`src/utils/sentry.ts` redacts addresses, hex, UUIDs, HD paths and emails; console/UI breadcrumbs are dropped). The DSN comes from the build env `RABBY_SENTRY_DSN` (`build/webpack.common.config.js:320`), which is only set in `autobuild.yml:97`, so local builds send nothing. To keep it: point it at a Crabble-owned Sentry project; set `sendDefaultPii: false` (`sentry-config.ts:29`, currently ships the user's IP); stop putting feedback text in `extra`; make reporting opt-in. If you won't run a Sentry project, strip it: that removes `@sentry/browser`, `@sentry/react`, `@sentry/webpack-plugin`, `build/sentry.js`, the `upload:sourcemap` script and the sentry-cli step in `build/release.js`. |
| 9 | **Opt-out preference**: `userDataTrackingOptOut` | After 1–3 are stripped it only gates Sentry. Make it a real opt-in: default to "off" on fresh install, upgrade and onboarding (`PasswordCard.tsx:144`, `preference.ts:256/398`), and relabel the Settings switch. Remove it if Sentry is stripped. |
| 10 | **Update page**: `src/background/service/extensionUpdate.ts:189` | Opens `rabby.io/updating?version=&lang=` in a tab when the user applies an update. It's a page visit, not telemetry, but it hands Crabble's version and language to Rabby's site. Point it at a Crabble page or skip the tab. |

## Keep (not tracking, but data leaves the device)

| # | Channel | Why keep |
|---|---|---|
| 11 | **Rabby API** (`api.rabby.io` via `@rabby-wallet/rabby-api`): balances, history, chain list, gas, swap/bridge quotes, pre-exec simulation, security checks such as `isBlockedAddress` and approval risk | The wallet is built on it, and the simulation and security checks protect funds. It necessarily sees every address you view. Note that every request carries `X-API-Key`, a per-install random UUID (`background/service/openapi.ts:80`), plus `X-Client`/`X-Version`, which works as a stable install ID. Rotating it is possible but untested: the backend may rely on it for rate limiting. |
| 12 | **Tx broadcast through Rabby's backend** (`openapiService.submitTxV2`, `provider/controller.ts:1239-1352`) | Functional path for sending transactions. |

Stripping 1–7 makes Crabble stop *reporting behaviour*. It does **not** make
the wallet private from DeBank, because #11 already sees all addresses and
activity. Truly decoupling from that would mean replacing the data backend,
which is a much larger project.

## Suggested order

1. Strip festats (#3) and its 39 call sites, then remove `@debank/festats`.
   Check whether `$ctx.ga` (the source/trigger context passed with txs) has any
   non-stats readers before removing it.
2. Strip GA4 (#1) and Matomo (#2), including the daily `sendEvent` interval and
   `startEnableUser` in `background/index.ts`, and the `clientId` /
   `extensionId` keys in `storage.local` (clear them in a migration).
3. Strip the uninstall URL (#4), `postActionLog` (#5), and the rating and
   screenshot-feedback flows (#6, #7), or swap 6–7 for a link to Crabble's
   issue tracker.
4. Decide on Sentry (#8) and then fix or remove the preference (#9).
5. Repoint the update page (#10).

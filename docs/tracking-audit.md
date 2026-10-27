# Tracking & telemetry

Crabble sends no analytics, usage metrics or error reports. This page records
what was removed from upstream Rabby, what still leaves the device and why,
and what to check when merging upstream.

## Removed

| Channel | What it sent | Where |
|---|---|---|
| Google Analytics 4 (`src/utils/ga4.ts`) | Connected dApp origins, a daily account-type/balance summary, unlock and import methods, settings snapshots, page views; per-install `clientId` | `google-analytics.com` |
| Matomo (`src/utils/matomo-request.ts`, `_raw/vendor/matomo*.js` loaded in every UI page) | dApp search terms, connected origins, pinned chains, page paths; per-install `extensionId` | `matomo.debank.com` |
| DeBank festats (`src/stats.ts`, `@debank/festats`) | Transaction funnel per chain and keyring type, perps trades with the wallet address, DeFi tx hashes, swap/bridge quote results | `festats.debank.com` |
| Sentry (`@sentry/*`, `src/utils/sentry*.ts`) | Error reports with the user's IP (`sendDefaultPii`), hardware-signing context, bootstrap and IndexedDB timings | Rabby's Sentry DSN (build secret) |
| Uninstall URL (`uninstalled.ts`) | Opened `rabby.io/uninstalled` with wallet flags on uninstall | `rabby.io` |
| Signing-rule logs (`openapi.postActionLog`) | Which security rules fired for each signature prompt | `api.rabby.io` |
| Rating prompt (`RateModal`) | Star rating flow and written feedback | `api.rabby.io`, Rabby's store listing |
| Screenshot feedback (`feedback.ts`, `ScreenshotContextMenu`) | Captured page plus the user's first addresses | `api.rabby.io` (Rabby support) |
| "Data analysis" setting | Opt-out toggle for the above; onboarding switched it on | — |

The Ledger WebHID transport still imports `@sentry/minimal` v6; the webpack
configs alias it to a no-op stub (`build/stubs/sentry-minimal.js`), so no
Sentry code ships. Keep the alias if the Ledger SDK is upgraded.

Startup clears what earlier builds left behind: the uninstall URL and the
`clientId`, `extensionId` and `UninstalledMetric` storage keys. Migration 11
drops the old `userDataTrackingOptOut` preference.

## Still leaves the device

| What | Why it stays |
|---|---|
| Rabby API (`api.rabby.io` via `@rabby-wallet/rabby-api`): balances, history, chain list, gas, swap/bridge quotes, pre-exec simulation, security checks | The wallet is built on it, and simulation and the security engine protect funds. It necessarily sees every address the user views. Every request carries `X-API-Key`, a random per-install UUID (`src/background/service/openapi.ts`), plus `X-Client`/`X-Version`, which together work as a stable install ID. Rotating it is possible but untested: the backend may rely on it for rate limiting. |
| Tx broadcast through Rabby's backend (`openapiService.submitTxV2`) | Functional send path. |
| Update page (`extensionUpdate.ts`) | Opens `rabby.io/updating?version=&lang=` when the user applies an update. Not telemetry, but it hands Crabble's version and language to Rabby's site. Point it at a Crabble page when one exists. |
| Support links (Settings → Feedback, Bridge "contact support") | Open `support.rabby.io` in a tab when clicked. |

## Kept local

- `$ctx.ga` on transactions: the gas-account recharge and recent-sends list
  read it. It never leaves the device.
- Hardware-signing diagnostics (`src/background/service/keyring/signing-diagnostics.ts`
  and the Ledger keyring's step timing) still classify signing errors. They
  only fed Sentry before; nothing reads them off-device now. They're woven
  into the signing path, so pruning them needs its own careful change.

## Upstream merges

Upstream Rabby will keep adding `ga4.fireEvent`, `matomoRequestEvent`,
`stats.report` and `Sentry.*` calls. Those modules no longer exist, so such
calls fail the type-check, but two things slip through:

- The UI's `wallet` proxy is loosely typed. A call to a removed background
  method (for example `wallet.reportStats` or `wallet.getStatsData`) compiles
  and only fails at runtime. Grep for them after each merge.
- New `wallet.openapi.*` calls that post logs or feedback, and new
  `browser.runtime.setUninstallURL` calls.

This should only match the startup cleanup in `src/background/index.ts`:

```bash
git grep -nE "ga4|matomo|festats|[Ss]entry|reportStats|statsData|postActionLog|postUserFeedback|submitFeedback|setUninstallURL" -- '*.ts' '*.tsx' '*.html' build .github package.json
```

`SecSDK/policy.json` still lists the removed packages until the next
`yarn build:pro` regenerates it.

## CI

`prscan.yml` was removed. It flagged dependencies on PRs that were very new,
reached sensitive browser globals, looked obfuscated, or mentioned crypto
keywords. The production build's Warden check (`yarn build:pro`, run on every
PR by `build.yml`) blocks bundled packages from reaching sensitive globals or
modules outside their graph, more strictly than prscan's warning, and
`.yarnrc.yml`'s `npmMinimalAgeGate: 15d` blocks very new versions. Not
covered any more: install scripts (`enableScripts: true`) and build-time
dependencies, obfuscation detection, and the 15-to-30-day window (the age
gate exempts `@rabby-wallet/*`, `@debank/*` and `warden-for-js`).

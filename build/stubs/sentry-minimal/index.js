// The Ledger WebHID transport reports errors through @sentry/minimal. Crabble
// ships no Sentry client, so the real facade would only bundle dead Sentry
// code. Installed in its place through package.json resolutions.
exports.captureException = () => '';

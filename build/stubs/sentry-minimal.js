// The Ledger WebHID transport reports errors through @sentry/minimal. Crabble
// ships no Sentry client, so the real facade would only bundle dead Sentry
// code (and trip Warden's global access check).
export const captureException = () => '';

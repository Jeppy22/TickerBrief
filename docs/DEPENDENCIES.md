# Dependency decisions

Expo SDK 57 / React Native 0.86 / React 19.2.3 and Python 3.13. npm and hash-pinned pip lockfiles are committed. Use `npm ci` and the provided requirements files.

The current Expo dependency tree initially reported 14 moderate audit entries propagating from two packages:

- `decode-uri-component` has an exponential malformed-URI decoding issue. [Official advisory](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) identifies 0.5.0 as patched. The npm override pins 0.5.0. Expo Router's `query-string@7.1.3` uses CommonJS; the one-line committed patch consumes the new default export without changing Router's query-string API. `patch-package` applies it on every installation. Tests cover valid and malformed query strings, and browser routing/export checks cover bundling.
- `xcode` uses `uuid.v4()` through an older vulnerable uuid dependency. [Official advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq) identifies 11.1.1 as patched. The scoped override keeps uuid's CommonJS API; a test exercises xcode's project identifier generation.

Do not run `npm audit fix --force`: its suggested Expo downgrade does not preserve SDK compatibility. Remove these overrides/patch once Expo adopts fixed compatible versions upstream, then rerun tests, Expo Doctor and both exports.

The backend's passing tests currently emit upstream Starlette/httpx and AnyIO deprecation notices. They do not indicate failed checks or a live provider request.

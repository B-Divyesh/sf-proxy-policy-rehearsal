# Independent verification — PASS

**Candidate:** `37fd67f1623da1484021a204031e11886daeea1d` (`main` at start of verification)  
**Production URL:** <https://proxy-policy-rehearsal.sociobot.in/>  
**Verified:** 2026-08-28 UTC  
**Scope:** independent QA against `.factory/brief.json`, the README, and the factory work order. Product source was not modified.

## Result

**PASS.** The candidate satisfies the stated CLI job: it loads synthetic YAML/JSON policy fixtures, uses only case-local mock DNS and headers, applies the documented Anubis/Caddy/Nginx-compatible request-matching subset, protects the forwarded-header trust boundary, and emits an explainable human or JSON decision matrix. The live documentation/demo matches this candidate exactly.

## Clean-checkout build and automated checks

The tree was clean and already checked out at the candidate before installation.

| Check | Result | Evidence |
| --- | --- | --- |
| `npm ci` | PASS | Installed 59 packages; `npm audit` reported zero vulnerabilities. |
| `npm test` | PASS | 2 Rust unit + 4 CLI integration + 3 site unit + 6 Playwright tests passed. The browser suite covers desktop and 390 px Chromium, invalid fixture handling, keyboard skip link, axe serious/critical, and offline reload. |
| `npm run build` | PASS | Release CLI at `dist/bin/ppr-linux-x86_64`; static production site at `dist/site/`. |
| `cargo package --locked` | PASS | Produced `target/package/proxy-policy-rehearsal-0.1.0.crate` (14 KiB). |
| `cargo fmt --check` | PASS | No formatting differences. |
| `cargo clippy --all-targets --locked -- -D warnings` | See low-severity note | One non-configured Clippy style warning (`clippy::collapsible_if`, `src/lib.rs:297`). No `lint`/`clippy` script or Clippy gate exists in the repository; required `npm test` and build gates pass. |

There is no repository TypeScript lint/typecheck configuration (`tsconfig`, ESLint config, or npm lint/typecheck script).

## CLI and package consumer exercise

I extracted the generated `.crate`, installed it into a fresh temporary Cargo root, and used the installed public binary rather than the checkout binary.

| Scenario | Result |
| --- | --- |
| `ppr --help` | PASS — documents `test`, `validate`, `format`, scripting JSON, and no-network scope. |
| `ppr test examples/monitor-policy.yaml --json` | PASS — exactly `9/9` decisions passed. |
| Trusted monitor via X-Real-IP/X-Forwarded-For | PASS — all adapters allowed mock `203.0.113.42`. |
| Untrusted peer supplying the same forwarded address | PASS — header ignored and all adapters challenged; matrix explains why. |
| Anonymous `/admin/settings` | PASS — all adapters blocked. |
| One adapter/one case selection | PASS — Caddy `monitor-via-proxy` returned one passing decision. |
| Invalid selections | PASS — no matching case and undeclared adapter each returned exit 2 with an actionable message. |
| `ppr validate examples/monitor-policy.yaml` | PASS — reported 2 rules, 3 cases, 3 adapters. |
| `ppr format` | PASS — states mock-DNS-only operation and supported-emulation boundary. |

The automated CLI integration suite separately verifies documented output, JSON, decision mismatch exit 1, and invalid-policy exit 2. No production API/server persistence or concurrency boundary applies to this local CLI.

## Live deployment identity, browser, privacy, and PWA checks

### Candidate identity

Fresh HTTPS fetches on 2026-08-28 found exact SHA-256 equality between the candidate build and production for `index.html`, `assets/index-DsxZ6GVo.js`, `assets/style-DnrM-ylB.css`, `sw.js`, and `ceramic-proxy-gates.webp`. The live HTML references those exact candidate asset filenames. This resolves the prior possible deployment-only concern: the site is serving the candidate.

### Functional and responsive browser QA

Fresh Chromium checks against the production URL passed:

- Desktop: ran the fixture (`9/9 pass`), entered invalid JSON (clear repair guidance), reset, and reran successfully (`9/9 pass`); zero console and page errors.
- 390 × 844 mobile with `prefers-reduced-motion: reduce`: no horizontal overflow (`scrollWidth === clientWidth === 390`), run succeeded, the skip link received first keyboard focus with a visible 3 px cobalt outline, and the reduced-motion media rule removes transitions/animations.
- Semantics: title present, `lang="en"`, exactly one `h1`, one `main`, and no image without alt text.
- Axe (`@axe-core/playwright`): zero violations total, including zero serious/critical findings.
- Live service worker: registered/controlled at `/sw.js`, cache `ppr-shell-v1` present, `registration.update()` completed with no waiting worker, and a visited shell reloaded offline with the heading and `Offline · demo still works` status intact.

### Privacy, outbound traffic, and response policy

- Browser capture observed five same-origin requests and **zero** third-party requests; editor storage remained `localStorage=0`, `sessionStorage=0`.
- Static/source inspection found no analytics, trackers, IP-intelligence lookup, live DNS, web-font CDN, external script, or persistence API. The only external URLs are user-initiated GitHub links and sitemap/robots metadata.
- Production responses are HTTPS with HSTS, CSP (`default-src 'self'`, `connect-src 'self'`, no object/frame embedding), `nosniff`, and strict-origin-when-cross-origin referrer policy. Hashed JS has `max-age=31536000, immutable`; HTML/service worker use 30-second revalidation; the hero uses a one-day cache.

## Performance and bundle budget

Production mobile Lighthouse 12.6 (simulated throttling) scored Performance **100**, Accessibility **100**, Best Practices **100**, SEO **100**. Measured FCP/LCP/interactive/speed index were 0.9 s, TBT 0 ms, CLS 0, and total transfer 27 KiB.

Candidate build sizes: application JS 4.67 KiB (2.02 KiB gzip), CSS 13.91 KiB (4.01 KiB gzip), hero WebP 17.98 KiB, and no font payload. These pass the 200 KiB JS, 50 KiB CSS, 120 KiB font, and 300 KiB mobile hero budgets.

## Defects

| Severity | Finding | Impact / disposition |
| --- | --- | --- |
| Low, non-blocking | Strict manual Clippy invocation fails on one `collapsible_if` style lint at `src/lib.rs:297`. | The repository does not configure Clippy as a quality gate; all required test/build/package checks pass. Track before adding a Clippy `-D warnings` CI gate. |

No critical, high, or medium defects found.

## Reproduction

```sh
npm ci
npm test
npm run build
cargo package --locked
cargo fmt --check
cargo clippy --all-targets --locked -- -D warnings
./dist/bin/ppr-linux-x86_64 test examples/monitor-policy.yaml --json
```

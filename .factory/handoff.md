# Handoff — Proxy Policy Rehearsal v0.1.1

## Independent verification 3 — FAIL

Verification on 2026-09-06 reviewed implementation `15206cf62a17b1a07898ff325d29f8745b5a2b1b`, documentation `6bdb393b662232f4837298a531a57b9c9fc3e547`, and the live site. The deployed runtime matches the implementation candidate byte-for-byte for the main HTML, demo HTML, service worker, hero, JavaScript, and CSS.

Four findings remain, so this candidate is not accepted:

- `ppr test` exits 0 for a fixture with zero cases and reports zero decisions.
- Eight public claim groups lack complete registered outcome tests.
- README says `ppr help format` shows the full format guide, but the working command is `ppr format`.
- The phone wordmark is 142 × 38 px and the Demo navigation target is 39 × 44 px, below the 44 × 44 px baseline.

All nine declared claim commands pass. The clean build, 26 browser checks, package, formatting, strict Clippy, installed CLI paths, live desktop/phone demo, offline update, zero-violation Axe scans, route crawl, security headers, and Lighthouse 100/100/100/100 also pass. Full evidence and required dispositions are in [`.factory/verification-3.md`](verification-3.md). Evidence files are under `/work/.evidence/ppr-verify-3/`.

## Release identity

- **Implementation candidate:** `15206cf62a17b1a07898ff325d29f8745b5a2b1b`
- **Previous reviewed implementation:** `37fd67f1623da1484021a204031e11886daeea1d`
- **Deployment:** `2026-09-06 UTC`, deployed from `dist/site/` to the existing `sf-proxy-policy-rehearsal` static app. The durable product host remains <https://proxy-policy-rehearsal.sociobot.in>.
- **Documentation/report commits:** this handoff is committed after the implementation candidate; see the final git log for its documentation SHA.

## What changed

- Added `ppr demo`. It writes the bundled monitor-policy fixture to a unique operating-system temporary directory, prints the location, and runs the real 9-decision matrix without changing an operator policy file.
- Added the one-click browser sandbox at `/demo/` and `/?demo=1`. It opens with a populated 9/9 matrix, keeps edits only in `demo:ppr:fixture`, has the required persistent sample banner, and offers **Reset demo** and **Start for real**.
- Reworked the first screen in plain words: **Test proxy rules before deployment** for self-hosted operators, with **Try it with sample data** as the first action and clear price, offline, and privacy facts.
- Added `.factory/claims.json` with nine public claims and exactly one tagged outcome test for each. Each documented claim command was run after `npm ci`.
- Added the product-designed `404` page and Static Web Apps response override. Unknown URLs now return HTTP 404 with the product page and a route back. `/demo` and `/demo/` return the product demo successfully.
- Added canonical, Open Graph, Twitter, favicon, apple-touch icon, robots, sitemap, route titles, consistent headers, complete footer, and a 1200×630 original-art social card.
- Added `.factory/demo.md`, `.factory/copy-audit.md`, and the verb-first catalog description. The catalog description is also at `/work/.evidence/catalog-description.txt`.
- Fixed the earlier `clippy::collapsible_if` warning. Strict Clippy is now clean.

## Run and verify

```sh
npm ci
npm test
npm run build
cargo package --locked
cargo fmt --check
cargo clippy --all-targets --locked -- -D warnings
./dist/bin/ppr-linux-x86_64 demo
npm run preview
```

`npm run build` writes the release executable to `dist/bin/ppr-linux-x86_64` and the static deploy root to `dist/site/`.

Every command in `.factory/claims.json` was run individually from the documented clean setup. The claims cover the one-click nine-decision demo, fixture-based mock DNS changes, local no-upload browser execution, offline reload, demo isolation, account-free core, bundled binary demo, remote-looking path rejection, and the absence of a proxy-service command.

## Verification evidence

- `npm ci`: passed; no production vulnerabilities reported.
- `npm test`: passed: 2 Rust unit tests, 5 Rust CLI integration tests, 3 browser-fixture unit tests, and 26 Playwright desktop/mobile checks.
- `npm run build`: passed; application JS is 5.41 KB (2.32 KB gzip), CSS is 17.09 KB (4.61 KB gzip), hero WebP is 17.98 KB, and the initial JavaScript budget is well below 200 KB.
- `cargo package --locked`: passed cleanly; 12 files, 49.4 KiB unpacked and 15.0 KiB compressed.
- `cargo fmt --check` and `cargo clippy --all-targets --locked -- -D warnings`: passed.
- Clean consumer check: extracted the packaged crate into a fresh temporary root, installed its public `ppr` binary, ran `ppr --help`, `ppr demo` (9/9), filtered JSON output, and an undeclared-adapter error path (exit 2).
- Local `verify-url.sh`: passed with title, `lang`, one h1, main landmark, alt text, labeled buttons, and no console errors. The Playwright Axe integration reports zero violations, locally and on HTTPS.
- Fresh live desktop and 390×844 phone contexts: first screen names the job, audience, and sample action; `/demo/` shows 9/9 populated rows; invalid JSON gives repair guidance; Reset demo returns 9/9; no console/page errors; no horizontal overflow; zero Axe violations. A dedicated browser context reloads the visited demo offline with `9/9 PASS`.
- Live route checks: `/`, `/demo`, `/demo/`, `/privacy/`, `/terms/`, social assets, robots, and sitemap return 200. An unknown URL returns HTTP 404 with title **Page not found — Proxy Policy Rehearsal**, one h1, and working home/demo links.
- Live `verify-url.sh` output is in `/work/.evidence/ppr-live/verify.json`; fresh browser evidence and desktop/mobile screenshots are in `/work/.evidence/ppr-live/`.
- Live mobile Lighthouse retry: Performance **100**, Accessibility **100**, Best Practices **100**, SEO **100**; simulated LCP **0.904 s**, CLS **0**, transfer **30,069 bytes**. Evidence: `/work/.evidence/ppr-live/lighthouse-retry.json`.

## Review findings disposition

| Earlier finding | Current disposition |
| --- | --- |
| Missing browser and CLI demo | Fixed: `/demo/`, `/?demo=1`, banner/reset/start-real controls, and `ppr demo` ship with real bundled sample data. |
| Missing claims registry | Fixed: nine claims with isolated tagged outcome tests in `.factory/claims.json`. |
| Metaphorical first screen | Fixed: plain job title, named audience, and visible sample action on the first screen. |
| Generic `/demo` and `/404` paths | Fixed: live `/demo` returns 200; unknown live URLs return designed HTTP 404 content. |
| Incomplete metadata and skeleton | Fixed: all route titles, metadata, social image, icons, nav, footer version, and legal links are present. |
| Missing copy audit and mood copy | Fixed: `.factory/copy-audit.md` records the landing copy and terminology table; headings now name jobs and sections. |
| Strict Clippy warning | Fixed: strict Clippy now passes. |

## Product boundaries and next steps

- The CLI models the documented shared matcher subset. It does not parse native Anubis CEL, Caddyfiles, or Nginx configuration, and it does not model rate limits, plugins, handler or location precedence, regex engines, CAPTCHA behavior, or external DNS refresh.
- `ppr demo` intentionally leaves its isolated temporary sample directory available at the printed location for inspection; operating-system temporary-file cleanup applies. It never changes a user-named policy fixture.
- The product is free under the researched brief. There is no paid offer or billing registration dependency, so no billing-offer metadata is needed.
- Future work: add conformance fixtures from real authorized operators and add release-pipeline cross-platform binaries with checksums. Native configuration importers should remain separately versioned adapters with conformance fixtures.

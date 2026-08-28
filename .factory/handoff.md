# Handoff — Proxy Policy Rehearsal v0.1.0

## What shipped

- A single Rust/Clap binary, `ppr`, for validating and executing YAML or JSON proxy-policy fixtures.
- First-match `allow`, `challenge`, and `block` decisions across declared `anubis`, `caddy`, and `nginx` profiles.
- Synthetic remote IPs and headers, per-case mock DNS, trusted-proxy enforcement, right-to-left X-Forwarded-For resolution, X-Real-IP support, exact/CIDR client matchers, path globs, methods, and exact headers.
- Human-readable decision matrices with derivation notes, plus stable `--json` output, adapter/case filtering, and exit codes 0/1/2 for pass/regression/input error.
- Strict validation with unknown-field rejection and explicit adapter/emulation boundaries in `ppr help format` and the README.
- A responsive static landing/docs site with an editable local rehearsal, pass/fail and invalid-input states, install documentation, original glacial ceramic imagery, privacy/terms pages, cache headers, and an offline service-worker shell.

## How to run

```sh
npm ci
npm test
npm run build
./dist/bin/ppr-linux-x86_64 test examples/monitor-policy.yaml
npm run preview
```

Static deployment root: `dist/site/` (with `index.html` at that root). The host-built release binary is `dist/bin/ppr-linux-x86_64`.

To verify the Rust publishing artifact without publishing:

```sh
cargo package --locked
```

## Verification

- `npm test`: passes 2 Rust unit tests, 4 CLI integration tests, 3 browser-fixture unit tests, and 6 Playwright checks across desktop Chromium and a 390 px Chromium viewport.
- Playwright verifies the live rehearsal, invalid-input recovery, legal routes, keyboard skip navigation, console cleanliness, serious/critical axe findings (zero), and offline reload.
- `npm run build`: passes and produces both required outputs.
- Factory URL verifier against the local production preview: HTTP 200; title present; `lang="en"`; exactly one h1; main landmark present; zero images missing alt; zero unlabeled buttons; zero console/page errors. Recorded load completion: 560 ms in the verifier environment.
- Lighthouse 13 mobile run against the local production preview: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.2 s, total blocking time 0 ms, CLS 0.
- Production site payload: 4.67 KB application JS (2.02 KB gzip), 13.91 KB CSS (4.01 KB gzip), and 17.98 KB 960×640 WebP hero. No web fonts, runtime CDNs, trackers, or third-party scripts.
- `npm audit --omit=dev`: zero production vulnerabilities. Full `npm audit`: zero vulnerabilities after pinning patched Vite/Vitest versions.
- `cargo package --locked --allow-dirty`: verified; 12 files, 45.5 KiB unpacked / 14.0 KiB compressed, explicitly limited to CLI source, tests, examples, docs, and license files.
- Desktop and 390 px full-page visual screenshots were inspected for overflow, legibility, hierarchy, and responsive stacking.

## Known boundaries

- This intentionally models the portable request-matching subset and does not parse native Anubis CEL, Caddyfiles, or Nginx configuration. Rate limits, nested CEL, handler/location precedence, regex engines, plugins, CAPTCHA behavior, and external DNS refresh are rejected or out of scope rather than approximated.
- The browser rehearsal is a compact, editable version of the documented monitor/forwarding regression fixture. The CLI is the authoritative runner for full YAML/JSON files and complete matcher support; a large Go/Rust WASM runtime was deliberately avoided to preserve the static product's 200 KB initial-JS budget.
- Release automation and cross-platform binaries remain factory/release-pipeline work. No registry publishing, deployment, DNS, or billing changes were performed.

## Suggested next steps

- Add policy fixtures from pilot operators and measure the stated seeded-regression catch rate.
- Add platform release builds and checksums in the repository release workflow.
- Consider native-config importers only as separately scoped, versioned adapters with conformance fixtures.

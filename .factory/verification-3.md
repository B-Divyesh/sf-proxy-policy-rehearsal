# Verify proxy policy tests before deployment — verification 3

## Verdict

**FAIL**

- Findings: **4** — 0 critical, 0 high, 2 medium, 2 low.
- Untested public claim groups: **8**.
- Implementation reviewed: `15206cf62a17b1a07898ff325d29f8745b5a2b1b`.
- Documentation reviewed: `6bdb393b662232f4837298a531a57b9c9fc3e547`.
- Live URL: <https://proxy-policy-rehearsal.sociobot.in>.
- Verified: 2026-09-06 UTC.

The report-only documentation commit changes only `.factory/handoff.md`. Fresh build artifacts from `15206cf` match the live HTML, demo HTML, service worker, hero image, JavaScript, and CSS byte-for-byte.

## Job, audience, and first action

The job is to test proxy allow, challenge, block, forwarded-address, and mock-DNS rules before deployment. The audience is self-hosted operators protecting visitors and monitors from bad proxy rules. The first action is **Try it with sample data**.

Fresh desktop and 390 × 844 phone sessions show all three before scrolling. Clicking the action opens `/demo/` and immediately shows the labelled 9/9 sample matrix.

## Findings

| Severity | Finding | Evidence and required disposition |
| --- | --- | --- |
| Medium | `ppr test` treats a fixture with zero cases as a successful test run. | A packaged, clean-installed `ppr` ran a valid fixture with adapters but no `cases`. It printed `0 passed · 0 failed · 0 unchecked · 0 decisions` and exited 0. This can give CI a false green without rehearsing a request. Make `test` fail with repair guidance when it selects zero cases; keep `validate` available for a policy with no cases. Add normal, zero-case, and filtered-zero-case tests. |
| Medium | The public claim registry is incomplete. | Eight public claim groups below have no complete, claim-tagged outcome test. The nine declared commands all pass, but passing the registry cannot prove all statements on the site, CLI help, Privacy page, and README. Add one registry entry and one outcome test for each retained claim, or narrow the copy. |
| Low | The README names the wrong command for the format guide. | README says `ppr help format` describes the supported fixture format and adapter boundaries. The clean-installed binary prints only command usage for that invocation. `ppr format` prints the promised guide. Correct the documented command and register/test the retained claim. |
| Low | Two phone targets are smaller than 44 × 44 CSS pixels. | At 390 × 844, the home wordmark is 142 × 38 and the Demo navigation link is 39 × 44. The wordmark is also 159 × 38 on desktop. Increase their hit boxes without changing their visible type. All other measured links, buttons, and result controls meet the baseline. |

## Declared claims

Every command in `.factory/claims.json` was run separately after `npm ci` in a detached clean checkout of `15206cf`.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `sample-demo` | PASS | Direct `/demo/` entry showed the label, nine rows, 9/9 pass, and reset restored the sample. |
| `mock-dns` | PASS | Changing the mock monitor address produced three regressions; reset returned 9/9. |
| `local-browser-matrix` | PASS | The sample rendered locally with same-origin GET requests only. |
| `offline-reload` | PASS | A dedicated context reloaded `/demo/` offline with 9/9 pass. |
| `demo-isolation` | PASS | A seeded real key stayed unchanged; leaving demo removed `demo:ppr:fixture`. |
| `free-core` | PASS | The editable 9/9 sample ran without account or sign-in UI. |
| `one-binary` | PASS | The built public executable ran `demo`, printed its temporary path, and produced 9/9. |
| `fixture-files-only` | PASS | A remote-looking path was treated as an unreadable local path and exited 2. |
| `no-proxy-service` | PASS | `ppr serve` was rejected as an unknown command with exit 2. |

### Untested public claim groups

These count as eight untested claims because none has a complete registered command, even where an untagged test or manual check supplies partial evidence.

1. **One-click sample path:** `sample-demo` opens `/demo/` directly; its claim test never clicks the landing action whose “one click” wording it claims.
2. **Existing-file safety:** README and demo output say `ppr demo` does not change existing policy files; `one-binary` checks printed text, not the filesystem outcome.
3. **CLI formats and modes:** site and README claim YAML and JSON input, readable and JSON output, and adapter/case filtering.
4. **Exit code contract:** README promises exit 0 for matched expectations, 1 for a mismatch, and 2 for invalid input or usage.
5. **Matcher and adapter behavior:** site and README claim client-IP, path, method, header, trusted-forwarding, Anubis, Caddy, and Nginx subset behavior.
6. **CLI network boundary:** CLI help, site, README, and Privacy say no network, live DNS, or IP-intelligence request occurs. URL rejection and browser request capture do not observe installed CLI network activity.
7. **Whole-site privacy:** site and Privacy say there are no analytics, trackers, cookies, third-party runtime services, scripts, or font CDN. The registered request test covers only the demo flow and allows same-origin requests.
8. **Format guide:** README claims `ppr help format` shows the format and adapter boundary. It is unregistered and false for the documented command.

Manual verification found groups 1 and 3–7 true for the exercised candidate, and a sentinel file stayed unchanged during group 2. That does not satisfy the required registry and sandbox contract.

## Live browser checks

- Desktop 1440 × 900 and phone 390 × 844 used new Chromium contexts. Both had one h1, `lang="en"`, a main landmark, no missing image alt text, no horizontal overflow, no console or page errors, and zero Axe violations.
- The first action was visible before scrolling. Clicking it opened `/demo/` with nine realistic decisions: trusted monitor allowed, spoofed forwarded address challenged, and anonymous admin request blocked across three adapters.
- The Demo label remained present through edits and reset. Changing mock DNS produced three regressions. Invalid JSON announced what failed and how to repair it. Reset recovered to 9/9.
- Starting for real removed `demo:ppr:fixture`, preserved a seeded real-data key, and returned an empty editor. Browser traffic during the flow used same-origin GET requests only.
- Keyboard Tab reached the skip link first with a visible 3 px focus outline. Ctrl+Enter ran the editor. Phone reduced-motion reported a 0.001 ms transition. No keyboard trap was found.
- `/`, `/demo`, `/demo/`, `/?demo=1`, `/privacy/`, and `/terms/` returned 200 with route titles, one h1, a main landmark, canonical metadata, consistent navigation, and zero Axe violations.
- An unknown route deliberately returned HTTP 404 with the product title, one h1, product styling, and working home and demo links.
- `robots.txt`, `sitemap.xml`, favicon, 180 × 180 touch icon, 1200 × 630 social card, and every visible internal or product-source link returned 200.
- The visited demo updated its service worker without a waiting worker, then reloaded offline with `9/9 PASS` and `Offline · sample still works`.
- Response headers include HSTS, `nosniff`, strict-origin referrer policy, permissions policy, and a self-only CSP with `frame-ancestors 'none'` sent as a header.
- The factory `verify-url.sh` passed. Evidence is under `/work/.evidence/ppr-verify-3/verify-url/` and fresh viewport screenshots are `/work/.evidence/ppr-verify-3/live-desktop.png` and `live-phone.png`.

## Clean build and installed CLI

- `npm ci`: PASS, 59 packages, zero reported vulnerabilities.
- `npm test`: PASS, 2 Rust unit tests, 5 CLI integration tests, 3 site unit tests, and 26 Playwright checks.
- `npm run build`: PASS; `dist/` contains the binary and site. Main JS is 5.41 KB (2.32 KB gzip), CSS is 17.09 KB (4.61 KB gzip), and the hero is 17.98 KB.
- `cargo package --locked`: PASS, 12 files, 49.4 KiB unpacked and 15.0 KiB compressed.
- `cargo fmt --check`: PASS.
- `cargo clippy --all-targets --locked -- -D warnings`: PASS.
- Clean consumer install from the packaged crate: PASS. The installed binary completed `--help`, `demo` (9/9), YAML and JSON fixtures, readable and JSON output, adapter/case filters, validation, `format`, mismatch exit 1, and invalid usage exit 2.
- Lighthouse mobile simulation: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 0.922 s, CLS 0, TBT 73.5 ms, transfer 30,099 bytes. Evidence: `/work/.evidence/ppr-verify-3/lighthouse.json`.

The product has no backend, account, tenant, database, payment, or live-request API. Tenant isolation, restart persistence, health, and 429/Retry-After checks do not apply. An AI feature would reduce the predictability required for deterministic policy tests, so there is no missed AI step.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| Missing browser and CLI demo | Fixed. The live one-click sample and clean-installed `ppr demo` both produce 9/9. |
| Missing claims registry | Partly fixed. Nine declared claims pass, but the new incomplete-registry finding above remains. |
| Metaphorical first screen | Fixed. The first screen plainly names the job, audience, action, result, price, offline state, and data handling. |
| Generic `/demo` and `/404` paths | Fixed. Demo returns 200; an unknown route returns the designed product page with deliberate HTTP 404. |
| Incomplete metadata and site skeleton | Fixed. Titles, descriptions, canonical and social metadata, assets, headers, footer, legal routes, robots, and sitemap are present. |
| Missing copy audit and mood copy | Fixed. `.factory/copy-audit.md` exists; the banned-word scan is clean; the catalog line is verb-first and 89 characters excluding newline. |
| Strict Clippy warning | Fixed. Strict Clippy passes in the clean candidate. |

All earlier functional and minor findings were rechecked. The four findings in this report are new or newly exposed by the required boundary and claim audit.

## Evidence commands

```sh
npm ci
npm test
npm run build
cargo package --locked
cargo fmt --check
cargo clippy --all-targets --locked -- -D warnings
npm run test:claims -- --grep @claim:<each-id> --project=desktop
cargo install --path target/package/proxy-policy-rehearsal-0.1.1 --root <clean-root> --locked
<clean-root>/bin/ppr demo
<clean-root>/bin/ppr test examples/monitor-policy.yaml --json
<clean-root>/bin/ppr test <zero-case-fixture>
<clean-root>/bin/ppr help format
/opt/fleet/lib/verify-url.sh https://proxy-policy-rehearsal.sociobot.in/ <evidence-dir>
```

**Final verdict: FAIL — 4 findings and 8 untested public claim groups.**

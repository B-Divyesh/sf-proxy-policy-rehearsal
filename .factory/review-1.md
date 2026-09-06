# Proxy policy rehearsal review 1

**Verdict: FAIL**

- **Live URL:** <https://proxy-policy-rehearsal.sociobot.in>
- **Implementation candidate reviewed:** `37fd67f1623da1484021a204031e11886daeea1d`
- **Documentation/report commit:** `fa21bf69da79d5e05ed7741c3de388a5858f4e9b`
- **Reviewed:** 2026-09-06 UTC
- **Findings:** 7 (3 high, 3 medium, 1 low)
- **Untested public claim groups:** 8

The implementation candidate is `37fd67f`. `fa21bf6` changes only
`.factory/handoff.md` and `.factory/verification.md`; it does not change product
runtime files. A production build from the reviewed checkout matched the live
HTML, JS, CSS, service worker, and hero image byte-for-byte. This is a product
finding, not a stale-deployment finding.

## Job, audience, and first action

The job is to test synthetic reverse-proxy allow, challenge, and block decisions
before deployment. The intended audience is self-hosted site operators who need
to avoid blocking real users or internal monitors. The first useful action should
be **Try it with sample data**.

On fresh desktop and 390 px phone sessions, the page instead opens with **“Test
the gate before traffic arrives.”** Its visible actions are **Install the CLI**
and **Try a local rehearsal**. It does not state the audience on the first screen
and it has no visible **Try it with sample data** action or explanation of what
that action will load.

## Findings

| Severity | Finding | Evidence and required disposition |
| --- | --- | --- |
| High | The mandatory demo sandbox is not shipped. | `/demo` returns the host's generic 404. `/?demo=1` returns the landing page but does not enter demo mode. Neither desktop nor phone has **Try it with sample data**, **Demo — sample data, nothing is saved**, **Reset demo**, or **Start for real**. The browser’s prefilled fixture can produce a realistic 9/9 decision matrix, and Reset restores that editor, but it is not an isolated labelled demo. The installed CLI also rejects `ppr demo` as an unrecognized subcommand. Ship the CLI sample command and a one-click, labelled, isolated browser demo, then test it from a clean context. |
| High | Public claims have no required claim registry or claim commands. | `.factory/claims.json` is absent. Therefore no declared claim command exists to run, and the test suite has no `@claim:` tags. At least these eight visible claim groups are untested under the required contract: local/deterministic operation; no live DNS; no IP feed or proxy start; no telemetry/no calls home; offline/offline-ready; no upload or persistence; no third-party runtime services; and the one-binary assertion. Existing unit and browser tests are useful, but they are not traceable claim tests. Add the registry and one tagged observable test for every retained public claim, or remove the claim. |
| High | The first screen does not use the required plain-language job, audience, and first action. | The h1 and title use the gate/traffic metaphor rather than naming the task. The first-screen description does not name self-hosted operators or their monitor/user-blocking risk. The only primary button is installation. The hero lede has 24 words, above the 22-word limit. Rewrite the first screen around the job and audience, put the sample action first, and state what happens after clicking. |
| Medium | Required demo and 404 routes are broken user paths. | Live `GET /demo` and `GET /404` both return HTTP 404 with title `Azure Static Web Apps - 404: Not found`, no product h1, no way back, and a console resource error. A deliberate 404 status is acceptable; this generic host error page is not the required product-designed 404. Add the real demo route and a product 404 page plus the Static Web Apps response override. |
| Medium | Required site structure and metadata are incomplete. | The landing and legal pages lack canonical links, Open Graph and Twitter metadata, an original social-card image, SVG/favicon and apple-touch icon. The landing header omits the required Privacy route; legal headers do not match the landing header. The footer omits “Built by Param Factory” and version/build id. These are required structural elements, not optional polish. |
| Medium | The required plain-language audit is missing and the public copy still contains mood/metaphor headings. | `.factory/copy-audit.md` is absent. Examples include “A preflight for proxy policy,” “Move the monitor. Watch the contract fail,” and “Production is a poor rehearsal room.” The required audit and terminology table were not produced, so the copy rules cannot be verified. Produce the audit, remove the metaphor headings, and keep one term for each concept. |
| Low | The earlier Clippy finding remains open. | `cargo clippy --all-targets --locked -- -D warnings` still fails on `clippy::collapsible_if` at `src/lib.rs:297`. This was already documented as non-gating in `.factory/verification.md`; it remains reproducible and must be fixed before making Clippy a strict quality gate. |

## Checks that passed

From the documented clean setup, `npm ci`, `npm test`, `npm run build`, `cargo
package --locked`, and `cargo fmt --check` passed. `npm test` completed 2 Rust
unit tests, 4 CLI integration tests, 3 site unit tests, and 6 Playwright tests.
The release build created `dist/bin/ppr-linux-x86_64` and `dist/site/`.

The documented Git install command was exercised in a clean temporary consumer
root. Its installed `ppr` binary completed the example with 9 passed decisions.
The packaged-crate consumer install also passed normal JSON output, adapter/case
filtering, and the invalid selection path (exit 2). The CLI's normal policy
matrix accurately showed allowed monitor traffic, challenged spoofed forwarded
IP traffic, and blocked anonymous admin traffic.

Fresh live desktop and phone browser contexts had no horizontal page overflow,
no console/page errors on successful paths, and no Axe violations. The browser
rehearsal produced 9/9 pass, reported invalid JSON with a repair step, Reset
restored the initial fixture, and the same run then recovered to 9/9. Keyboard
support includes the skip link and Ctrl/Cmd+Enter. The reduced-motion rule is
present. A fresh visited service-worker context reloaded the landing page offline
with `Offline · demo still works`; this is functional, but its demo wording is
misleading until a real demo exists. Browser request capture during the successful
flow found no third-party requests.

Privacy and terms return 200 with route titles and one h1. Production sends CSP,
HSTS, `nosniff`, and a strict-origin referrer policy. `robots.txt` and
`sitemap.xml` return 200. No backend applies to this local CLI, so tenant,
restart, health, and 429 checks are not applicable.

## Earlier findings disposition

The only earlier recorded finding was the low-severity Clippy warning. It is
still present, as shown above. The earlier report's claim of a passing demo is
not accepted for this review because the current live product has no required
demo route, sandbox label, or CLI demo command. All other earlier verification
observations were rechecked where applicable and are recorded in the passed
checks above.

## Commands and evidence

```sh
npm ci
npm test
npm run build
cargo package --locked
cargo fmt --check
cargo clippy --all-targets --locked -- -D warnings  # fails as reported
cargo install --git https://github.com/B-Divyesh/sf-proxy-policy-rehearsal --bin ppr --root <clean-root>
<clean-root>/bin/ppr test examples/monitor-policy.yaml --json
curl -I https://proxy-policy-rehearsal.sociobot.in/
curl -i https://proxy-policy-rehearsal.sociobot.in/demo
curl -i https://proxy-policy-rehearsal.sociobot.in/404
```

Browser evidence used fresh Chromium desktop and 390 × 844 phone contexts against
the live URL, including populated output, invalid/recovery, offline reload,
reduced motion, Axe, route titles, and the `?demo=1` entry path.

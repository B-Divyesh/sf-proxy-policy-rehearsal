# Proxy Policy Rehearsal

Test proxy rules before deployment. `ppr` is for self-hosted operators who need to check monitor allowlists, forwarded-IP trust, and block rules before real visitors are affected.

It reads YAML or JSON fixture files and compares synthetic requests against the documented Anubis, Caddy, and Nginx matcher subset. Each fixture supplies its own mock DNS answers. The CLI reads fixture file paths, does not start a proxy service, and has no remote URL input.

## Try the sample

Open the browser sandbox at [proxy-policy-rehearsal.sociobot.in/demo/](https://proxy-policy-rehearsal.sociobot.in/demo/). It loads nine monitor and forwarded-IP decisions at once.

The Demo banner marks the sample clearly. Demo edits use the `demo:ppr:fixture` browser namespace. Reset demo restores the bundled fixture. Start for real discards that demo namespace. The browser sample works offline after its first visit and makes same-origin GET requests only.

Run the matching CLI sample from the bundled `ppr` binary:

```sh
ppr demo
```

The command copies `examples/monitor-policy.yaml` to a temporary directory, prints that location, and runs the matrix there. It does not change policy files you already have.

## Install

Build the single binary with Rust 1.88 or newer:

```sh
cargo install --git https://github.com/B-Divyesh/sf-proxy-policy-rehearsal --bin ppr
```

The sample and free core do not require an account.

## Use your fixture

Copy [`examples/monitor-policy.yaml`](examples/monitor-policy.yaml), then run every case against each declared adapter:

```sh
ppr test examples/monitor-policy.yaml
```

Filter adapters or cases and emit stable JSON for scripts:

```sh
ppr test policy.yaml --adapter caddy,nginx --case monitor-via-proxy
ppr test policy.yaml --json > rehearsal.json
```

Validate a fixture without running it:

```sh
ppr validate policy.yaml
```

Exit code `0` means every selected expectation passed. Exit code `1` means a decision differs. Exit code `2` means invalid input or CLI usage. `ppr help format` describes the supported fixture format and adapter boundaries.

### Fixture shape

```yaml
version: 1
default: challenge
trusted_proxies: ["10.0.0.0/8"]
adapters:
  anubis: { forwarded_header: X-Real-IP }
  caddy:  { forwarded_header: X-Forwarded-For }
  nginx:  { forwarded_header: X-Forwarded-For }
rules:
  - name: allow health monitor
    action: allow
    match:
      client_ip: ["dns:monitor.internal"]
      path: ["/health"]
      methods: [GET]
cases:
  - name: monitor-via-proxy
    request:
      remote_ip: 10.2.0.8
      method: GET
      path: /health
      headers:
        X-Forwarded-For: 203.0.113.42
        X-Real-IP: 203.0.113.42
    dns:
      monitor.internal: [203.0.113.42]
    expect:
      anubis: allow
      caddy: allow
      nginx: allow
```

Rules run top to bottom. The first complete match decides. Values within one matcher are alternatives. Different matcher fields must all match. The supported matchers are exact IP or CIDR, `dns:name`, exact or one-star path globs, methods, and exact request headers.

Forwarded client addresses count only when the immediate peer matches `trusted_proxies`. X-Forwarded-For chains are read from right to left past trusted hops. A direct peer can never make its own forwarded header trusted.

## Supported boundaries

`ppr` checks the request-matching subset shared by common Anubis CEL policies, Caddy request matchers, and Nginx `real_ip` with `geo` or `map` rules. It does not parse native configurations. It does not model rate limits, nested CEL, Caddy handler order, Nginx location precedence, regex engines, plugins, CAPTCHA behavior, or external DNS refresh.

It does not query live DNS or IP-intelligence feeds. It does not start, operate, or inspect a production proxy. The hosted site includes no analytics, trackers, third-party runtime services, or font CDN.

## Develop, test, and deploy

```sh
npm ci
npm test
npm run build
cargo package --locked
cargo fmt --check
cargo clippy --all-targets --locked -- -D warnings
```

Run every public claim from a clean setup with the commands listed in [.factory/claims.json](.factory/claims.json). For example:

```sh
npm run test:claims -- --grep @claim:sample-demo --project=desktop
```

`npm run build` writes the release executable to `dist/bin/ppr-linux-x86_64` and the static site to `dist/site/`. Preview the site with `npm run preview`. Deploy `dist/site/` with the product’s durable static-host configuration, including `staticwebapp.config.json`.

The crate is ready to publish but is not published by this repository worker:

```sh
cargo package --locked
```

## Privacy and license

Read the hosted [Privacy](https://proxy-policy-rehearsal.sociobot.in/privacy/) and [Terms](https://proxy-policy-rehearsal.sociobot.in/terms/) pages. This project is MIT licensed; see [LICENSE](LICENSE).

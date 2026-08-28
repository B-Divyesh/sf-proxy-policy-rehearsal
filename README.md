# Proxy Policy Rehearsal

`ppr` is a local, deterministic test runner for reverse-proxy policy changes. It helps self-hosted operators catch broken monitor allowlists, localhost assumptions, and spoofable forwarded-IP rules before deploying Anubis-, Caddy-, or Nginx-facing policy.

It never looks up live DNS, contacts an IP feed, starts a proxy, or sends telemetry. Every request, forwarded header, and DNS answer comes from the test file.

## Install

Download a release binary, or build the single binary with Go 1.23+:

```sh
go install github.com/B-Divyesh/sf-proxy-policy-rehearsal/cmd/ppr@latest
```

## Usage

Copy [`examples/monitor-policy.yaml`](examples/monitor-policy.yaml), then run all cases against all declared adapters:

```sh
ppr test examples/monitor-policy.yaml
```

Select adapters or cases and emit stable machine output:

```sh
ppr test policy.yaml --adapter caddy,nginx --case monitor-via-proxy
ppr test policy.yaml --json > rehearsal.json
```

Validate without running cases:

```sh
ppr validate policy.yaml
```

Exit codes are `0` when every selected expectation passes, `1` when a decision differs, and `2` for invalid input or CLI usage. `ppr help format` documents the file format and adapter boundaries.

### Policy shape

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

Rules are evaluated top-to-bottom; the first complete match decides. Values in one matcher are OR-ed, while different matcher fields are AND-ed. Supported matchers are exact IP/CIDR or `dns:name` client IP, exact/glob path, method, and exact request headers. DNS names resolve only from each case's `dns` map.

Forwarded client addresses are trusted only when the immediate peer matches `trusted_proxies`. X-Forwarded-For chains are walked right-to-left past trusted hops; otherwise the direct peer wins. This intentionally rehearses the trust boundary rather than blindly accepting a header.

## Adapter boundary

The adapters reproduce the shared request-matching subset operators commonly express in Anubis CEL policy, Caddy request matchers, and Nginx `real_ip` plus `geo`/`map` rules. They do not parse native config and do not claim to emulate rate limits, nested CEL, Caddy handler order, Nginx location precedence, regex engines, or external DNS refresh. `ppr` reports unsupported adapter names and header modes as validation errors instead of guessing.

## Develop and verify

```sh
npm ci
npm test
npm run build
```

`npm test` runs Go unit/integration tests and the browser site's tests. `npm run build` compiles release binaries into `dist/bin/` and the static site into `dist/site/`. Preview the landing page with `npm run preview`.

To produce the publishable source archive without registry credentials:

```sh
npm pack
```

## Privacy and security

The CLI is offline and accepts only synthetic inputs. The browser demo runs in-page and does not upload or persist its editor contents. See the site privacy and terms pages for the hosted documentation.

## License

MIT. See [LICENSE](LICENSE).

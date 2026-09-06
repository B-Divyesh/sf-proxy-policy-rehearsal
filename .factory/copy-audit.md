# Landing-page copy audit — 2026-09-06

Method: each visible sentence, heading, label, action, and terminal line on `site/index.html` is listed below. Counts split hyphenated terms as one word. No entry exceeds 22 words. The banned-word scan found no matches: leverage, seamless, effortless, robust, powerful, intuitive, reimagine, supercharge, unlock, delightful, journey, ecosystem, or AI-powered.

| Copy | Words | Result |
| --- | ---: | --- |
| Proxy Policy Rehearsal | 3 | pass |
| Demo | 1 | pass |
| How it works | 3 | pass |
| Privacy | 1 | pass |
| Source | 1 | pass |
| Offline-ready | 1 | pass |
| Proxy policy checks | 3 | pass |
| Test proxy rules before deployment | 5 | pass |
| For self-hosted operators who need to protect visitors and monitors from bad proxy rules. | 14 | pass |
| Try it with sample data | 6 | pass |
| Loads nine monitor and forwarded-IP checks. | 6 | pass |
| Free core | 2 | pass |
| Works offline after first visit | 5 | pass |
| No data upload | 3 | pass |
| Allow trusted monitor | 3 | pass |
| Challenge spoofed header | 3 | pass |
| Block anonymous admin request | 4 | pass |
| Browser preview | 2 | pass |
| Check a policy fixture in your browser | 7 | pass |
| Use the sample above, or paste a JSON fixture to compare the three documented adapters. | 15 | pass |
| Policy fixture (JSON) | 3 | pass |
| Clear input | 2 | pass |
| Paste a policy fixture, or open the sample demo. | 9 | pass |
| Press Ctrl + Enter to run. | 5 | pass |
| This page does not upload the fixture. | 7 | pass |
| Run rehearsal | 2 | pass |
| Decision results | 2 | pass |
| Ready | 1 | pass |
| Your decision results appear here. | 5 | pass |
| Open the sample demo or run a JSON fixture. | 9 | pass |
| How it works | 3 | pass |
| Test a policy in three steps | 7 | pass |
| Write synthetic requests | 3 | pass |
| Name the remote address, headers, path, and expected decision. | 9 | pass |
| Set mock DNS answers | 4 | pass |
| Keep monitor allowlists inside the fixture instead of querying live DNS. | 11 | pass |
| Run the matrix | 3 | pass |
| Compare allow, challenge, and block decisions before you edit production rules. | 11 | pass |
| CLI for CI | 3 | pass |
| Run the same checks from one binary | 8 | pass |
| The ppr binary reads YAML or JSON fixture files and emits readable or JSON results. | 15 | pass |
| Demo uses bundled sample data in a temporary directory. | 9 | pass |
| Supported policy checks | 3 | pass |
| Use the shared matcher subset | 6 | pass |
| Each adapter checks client IP, path, method, and exact headers. | 10 | pass |
| Unsupported native behavior is named instead of guessed. | 8 | pass |
| Checks client IP, request path, method, and header conditions from the shared subset. | 13 | pass |
| Does not parse nested CEL or bot weights | 9 | pass |
| Checks trusted proxy client IP derivation and the portable request matcher subset. | 12 | pass |
| Does not model handler order or plugins | 7 | pass |
| Checks real_ip trust with geo and map-style decisions. | 9 | pass |
| Does not model location precedence or regex | 7 | pass |
| Scope and privacy | 3 | pass |
| What this tool does not do | 6 | pass |
| It does not query live DNS or IP-intelligence feeds. | 10 | pass |
| It does not start, operate, or inspect a production proxy. | 11 | pass |
| It does not include telemetry, trackers, or third-party runtime services. | 10 | pass |
| Start safely | 2 | pass |
| Run policy checks before you change production rules | 9 | pass |
| Local proxy policy tests for self-hosted operators | 7 | pass |
| Built by Param Factory | 4 | pass |

The code-example headings (`CASE`, `ADAPTER`, `CLIENT`, `DECISION`, and `EXPECTED`) are data labels rather than prose. Their sample rows are concrete output from `ppr demo`, not marketing copy.

## Terminology table

| Concept | Term used everywhere |
| --- | --- |
| A declarative JSON or YAML input | fixture |
| A request to test | synthetic request |
| The allow, challenge, or block result | decision |
| An Anubis, Caddy, or Nginx compatibility choice | adapter |
| A declared DNS answer inside a case | mock DNS answer |
| The one-click isolated trial | sample demo |
| The command-line executable | `ppr` binary |

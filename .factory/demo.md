# Demo sandbox

## Browser demo

Open `https://proxy-policy-rehearsal.sociobot.in/demo/`. `/?demo=1` enters the same browser-demo state from the landing route.

The sample contains three realistic synthetic requests: a trusted monitor through a proxy, an untrusted peer spoofing a forwarded address, and an anonymous admin request. It evaluates all three documented adapters, so the populated result is nine decisions.

The persistent banner says **Demo — sample data, nothing is saved**. While it is visible, editor changes are stored only at the browser key `demo:ppr:fixture`. The application does not read or write a real-data namespace. **Reset demo** restores the bundled sample and its 9/9 result. **Start for real** removes `demo:ppr:fixture` and returns to an empty landing-page editor.

The service worker caches the demo shell and bundled sample. After a successful first visit, the demo reloads and reruns its populated sample offline.

## CLI demo

Run `ppr demo`. The binary copies `examples/monitor-policy.yaml` into a unique directory beneath the operating system temporary directory, prints the fixture location, and runs it. It never changes a policy file outside that temporary directory.

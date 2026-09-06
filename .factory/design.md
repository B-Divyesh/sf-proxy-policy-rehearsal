# Visual thesis — glacial minimal ceramics

Proxy Policy Rehearsal should feel like a quiet workbench before a risky deployment: cold, exact, and tactile. The visual language pairs thin glacial strata with hand-thrown ceramic forms. Rules become stacked porcelain gates; a cobalt request bead passes through them. This gives the otherwise abstract forwarding chain a physical model without drifting into generic security shields, neon terminals, or gradient SaaS chrome.

## Palette

The site is intentionally single-mode, painted explicitly in a pale mineral light treatment. The fixed treatment supports the ceramic-material thesis and makes the decision colors stable in screenshots and documentation.

- `--ice-25 #f7f9f8`: snow-lit page background.
- `--ice-75 #edf2f1`: recessed frost fields.
- `--porcelain #fffdfa`: raised working surfaces.
- `--ink #182525`: primary copy; 14.3:1 on porcelain.
- `--slate #506260`: secondary copy; 6.2:1 on porcelain.
- `--cobalt #245b67`: action and focus color; 7.1:1 on porcelain.
- `--cobalt-dark #163f49`: pressed action.
- `--lichen #35694f`: allow/success, always paired with a label.
- `--ochre #8a5b18`: challenge/warning, always paired with a label.
- `--oxide #9a3f34`: block/error, always paired with a label.
- `--hairline #c7d4d1`: structural rules, never the only interactive affordance.

## Type

No font files or external requests. The display face uses Georgia as a calm, slightly irregular editorial serif; the interface and code use the native system sans/monospace stacks. The contrast reads as a ceramic studio ledger beside an operator's terminal. Scale: 14, 16, 18, 24, 40, and responsive 64 px; body is never below 16 px.

## Spacing and form

An 8 px base rhythm with 4 px for optical corrections. Content is capped at 1180 px and long text at 68 characters. Corners use asymmetrical, vessel-like radii (`28px 28px 12px 28px`) only for meaningful surfaces. Hairlines and negative space group material before cards do. Controls are at least 44 px high; at 390 px, navigation condenses, the hero and demo stack, and table results become labeled rows.

## Interaction grammar

Primary actions are dense cobalt lozenges; secondary actions are quiet text links with an arrow. A run begins from the input vessel and settles as rows in the result ledger. Focus is a 3 px cobalt halo with a 2 px snow offset. Copy controls confirm inline. Errors state what failed and the repair. Offline status is explicit, while the rehearsal itself remains fully local.

## Motion

Only state change moves: the hero bead drifts once through its gates on first view (600 ms), and result rows settle upward (180 ms). Nothing loops. Under `prefers-reduced-motion: reduce`, transforms and smooth scrolling are removed and states switch instantly; the illustration still communicates via position and contrast.

## Original asset plan and provenance

- `site/public/ceramic-proxy-gates.webp`: original AI-generated still life used as the explanatory hero. Prompt: “Editorial product still life for a developer tool: three thin hand-built porcelain gates arranged in a precise sequence on translucent blue-white ice, one small deep-cobalt ceramic bead traveling through aligned openings, subtle ruler incisions and hairline shadows, glacial minimal ceramics, matte mineral textures, cool daylight, generous pale negative space, no people, no lettering, no logos, no UI, landscape 3:2.” Generated for this product with the factory image generator (`/opt/fleet/lib/gen-image.sh`, 2026-08-28), then locally converted to WebP. Original asset; project use under the repository MIT license.
- `site/public/social-card.webp`: a 1200×630 crop composed locally from the original ceramic hero with ImageMagick on 2026-09-06. It keeps the same porcelain gates and cobalt bead for social previews without adding text or a stock asset.
- `site/public/apple-touch-icon.png`: a local 180×180 crop of the same original ceramic hero, composed with ImageMagick on 2026-09-06.
- `site/public/favicon.svg`: hand-authored proxy-gate geometry in the site palette. It is an original project asset, not an icon-library asset.
- All interface glyphs are hand-authored CSS geometry or plain text. No stock imagery, icon package, or third-party runtime asset is used.

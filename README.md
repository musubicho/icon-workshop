<p align="center">
  <img src="static/brand/nyatabi.webp" width="72" height="72" alt="" />
</p>

<h1 align="center">Nyatabi Icons</h1>

<p align="center">Turn the small things of a journey into icons.<br />Soft shapes for everyday things.</p>

A collection of **110 SVG originals** drawn for [Nyatabi](https://nyatabi.app), with the same shapes available for Web and native iOS. Browse them at **<https://icons.nyatabi.app>**.

Rounded outlines, warm ink, vermilion, gold, and matcha green. The collection covers the expense categories and itinerary types used in Nyatabi, ledger, receipt, wallet, split, transfer, and knot motifs, and the interface icons that replace SF Symbols in the app's menus, rows, and empty states. The site's own interface uses only icons from this collection.

## The site

- Search by name, ID, or collection; press <kbd>/</kbd> to focus the search box.
- Switch the grid between original colors and monochrome, and the whole site between light and dark.
- Each icon has its own page at `/icon/<id>`: light and dark previews, sizes from 16 to 48 px, copy or download the SVG in original colors or as `currentColor`.
- Export the entire collection as an Xcode asset catalog.

The site is a SvelteKit app prerendered to static files. Editing is only available in the local dev server.

## Run locally

Requires **Node.js 22.17+** and **pnpm**.

```sh
git clone https://github.com/musubicho/icon-workshop.git
cd icon-workshop
pnpm install
pnpm dev
```

Open the URL Vite prints (port **4173** by default). The dev server binds to localhost, and its save endpoint only accepts same-origin requests from `localhost` or `127.0.0.1`.

## Refine an icon

Read the drawing rules in [docs/icon-guidelines.md](docs/icon-guidelines.md) first: stroke width, palette, spacing between lines, and the self-check before each change.

1. Open an icon's page in the dev server and click **Open editor**, or append `?edit` to its URL.
2. Select shapes on the canvas or in **レイヤー** (Layers). Use **ノード** (Nodes) to edit path anchors and Bézier handles. **ペン** (Pen), **四角形** (Rectangle), **楕円** (Ellipse), and **線** (Line) draw new geometry.
3. Click **保存する** (Save) or press **⌘S / Ctrl+S** to write the original to `icons/`. **Add an icon** on the home page opens a blank artboard in the editor.

The workbench supports multi-selection, movement, scaling, rotation, alignment, distribution, grouping, ordering, and conversion of basic shapes to paths. The inspector edits geometry, palette colors, opacity, and document metadata. Source edits and the canvas share one document; invalid source keeps the last valid preview and cannot be saved.

- **V / A**: selection / nodes. **P / R / E / L / H**: pen / rectangle / ellipse / line / pan.
- **Space + drag** pans; the wheel zooms. **Shift** constrains gestures; **Alt** bypasses grid snapping.
- Arrow keys move by **0.1** SVG units, or **1** with Shift. **⌘D** duplicates; **⌘G / ⇧⌘G** groups / ungroups.
- Drag while placing pen anchors to draw curves. **Enter** finishes; clicking the first anchor closes the path.
- A selected anchor exposes midpoint insertion, smooth/corner conversion, breaking, closing, and deletion. The anchor picker and coordinate fields also allow keyboard editing.
- **⌘Z / ⇧⌘Z** undo / redo up to 100 operations. A complete drag is one operation.

Drafts are stored in this browser and offered for recovery when you reopen the editor. External file changes produce a conflict comparison; download your draft, load the disk version, or manually merge before saving. Hidden and locked layers are editing aids only and do not change exported artwork.

The bottom strip previews the complete icon at 16, 24, and 48 px in light/dark and color/monochrome. **書き出す** (Export) downloads the current draft as SVG or a single-icon iOS asset catalog; the sidebar link exports the saved collection. The inspector's **セルフチェック** lists the drawing self-check; follow it and sync the exported assets into the app after saving final icon changes.

Browser regression checks (with `pnpm dev` running and `agent-browser` installed):

```sh
node scripts/check-editor.js
```

The browser check uses an isolated session and simulated save responses; HTTP tests use a temporary directory. Neither changes repository icons.

## Use on the Web

Use an original from `icons/`:

```html
<img src="/icons/ramen.svg" width="24" height="24" alt="" />
```

For an icon that follows text color, choose **Monochrome currentColor** on the icon's page, then copy or download it and inline the SVG:

```html
<button><svg …>…</svg> Ramen</button>
```

Provide an accessible label when an icon conveys meaning on its own.

## Use on iOS

Choose **Color** or **Monochrome** in the toolbar, then click **Export iOS assets**. Unzip the download and add `MusubiIcons.xcassets` to your app target in Xcode.

| Export | Native behavior |
| --- | --- |
| Original colors | Separate light and dark assets, selected automatically by the system |
| Monochrome | Template images that follow your foreground color or UIKit tint |

Resource names use `musubi-<id>`, such as `musubi-ramen`. Assets have an intrinsic size of **24 pt** and preserve their vector representation for scaling.

```swift
// SwiftUI
Image("musubi-ramen")
    .resizable()
    .scaledToFit()
    .frame(width: 24, height: 24)

// UIKit
UIImage(named: "musubi-ramen")
```

These are native image sets. Symbol weight variants, text-baseline alignment, and SF Symbol animations require separately authored custom symbol templates.

## Drawing conventions

- **48 × 48** source grid, **2.4 px** strokes, round caps and joins.
- Use curved geometry for soft corners: arcs, Bézier curves, and rounded shapes. Keep small details readable at 16–24 px.
- Give each SVG a `<title>` for its display name and a `data-category` for its collection.
- Use paths and basic shapes with direct `fill` / `stroke` attributes. Convert text to paths.
- Pair colored outlines with quiet, neutral backgrounds.

The four palette colors adapt between appearances:

| Color | Light | Dark |
| --- | --- | --- |
| Ink | `#453D35` | `#EFE4D7` |
| Vermilion | `#C23B22` | `#FF7A5C` |
| Gold | `#8A6200` | `#E0A526` |
| Matcha | `#53765A` | `#9FBC91` |

Custom colors retain their original values in color previews and exports, so check their contrast in both appearances. The SVG validator accepts paths and basic shapes; scripts, external references, CSS styles, filters, text, and embedded bitmaps are unsupported.

## Collections

| Collection | Icons |
| --- | --- |
| Ledger | Guest, ledger, receipt, split, transfer, wallet |
| Food | Groceries, matcha, onigiri, pudding, ramen, sake, takeout |
| Travel | Bus, drive, gift, lodging, passport, pin, plane, sight, taxi, ticket, train, walk |
| Everyday | Entertainment, medicine, other, rent, shopping, SIM, subscription, tissue, top-up, utilities |
| Interface | Appearance, back, calendar, camera, chats, clear, clock, cloud, copy, database, delete account, developer, device, directions, done, download, edit, expand, failed, filter, fit, folder, forget, hide, info, invite, language, later, layers, link, list, locate, map, memory, model, more, nearby, note, photo, plus, privacy, profile, refresh, reschedule, scan, schedule, seal, search, send, settings, share, sheet, sign out, sparkle, stats, storage, swap, trash, undo, usage, want |
| Knot | Knot |

## Project files and checks

| Path | Purpose |
| --- | --- |
| `icons/` | Editable SVG originals; the source of all pages and exports |
| `src/lib/svg.ts` | Validation, themable markup, and color exports |
| `src/lib/ios.ts` | Shared Xcode asset catalog export |
| `src/lib/editor/` | Development workbench and SVG editing operations |
| `src/lib/server/atelier.ts` | Dev-only save endpoint (Vite plugin) |
| `src/routes/` | Home, icon pages, and the prerendered `MusubiIcons-<mode>.zip` |

```sh
pnpm test    # validation, save conflicts, and asset export
pnpm check   # svelte-check
pnpm build   # static site in build/
```

## Deploy

Cloudflare Pages builds from GitHub on every push to `main`:

| Setting | Value |
| --- | --- |
| Build command | `pnpm test && pnpm build` |
| Output directory | `build` |
| Environment | `PNPM_VERSION=12.4.1` (Node comes from `.node-version`) |
| Custom domain | `icons.nyatabi.app` |

# Website previews matched to the selected mockups

The four generated boards in `images/01-swiss-red.png` through `images/04-forest-notebook.png` are the visual references. The implementation follows their layout, portrait and video proportions, typography, navigation and illustrated research/teaching sections. Exact biography text, original photographs, video thumbnails and working destinations come from the existing site.

Open `review.html` for a remote-friendly gallery of **actual Chromium screenshots**, with direct links to every working page. Choose among four designs and light/dark appearances. `boards.html` shows the original generated references. `index.html`, `teaching.html`, `teaching-videos.html` and `projects.html` share the comparison controls and preserve style/appearance as you navigate.

- **Swiss red:** a slim red navigation rail, full biography, equally wide portrait and stacked interviews, then broad illustrated research and teaching rows.
- **Warm editorial:** serif type, a tall portrait, paired interviews, and two illustrated sections below.
- **Scientific index:** portrait at the left of the biography and an illustrated research/teaching index at the right.
- **Forest notebook:** a compact green rail beside the biography; the interviews and illustrated sections span the full width below it.

Teaching keeps the semester index and illustrated playlist column inside the selected site's layout. Swiss uses the same left navigation, red divider, 1060px outer width, heading type and responsive breakpoint as its homepage. Its main area contains the course table and a compact 280px playlist column. Teaching, the video directory and Open Source share that shell; the navigation changes to the same horizontal layout as Home at 900px and below. All courses, years, recording statuses, playlists, searches and cheatsheets are preserved.

No production homepage theme is selected by these previews. The existing unrelated local edit to the root `teaching.html` is excluded: `build_resources.py` reads committed resource content with `git show HEAD`.

## Rebuild

```sh
python3 design-explorations/homepage-themes-2026/round-2/build_preview.py
python3 design-explorations/homepage-themes-2026/round-2/build_resources.py
python3 design-explorations/homepage-themes-2026/round-2/build_review.py
```

`build_preview.py` preserves all three biography paragraphs and their links from the root homepage. `content.json` identifies the two original conversations confirmed by Nipun: IIIT-Delhi AlumX and TEDxConversations. Profile icons and six illustrated links follow the selected boards. Teaching illustrations reuse the existing cover atlas; the research illustrations use the previously generated matching atlas.

## Verify and capture

Run `verify.cjs` and `verify_resources.cjs` using an existing `jsdom` installation on `NODE_PATH`. They check exact content preservation, local assets, all style/mode settings, shareable URLs, navigation, search, recording filters and pagination.

Serve the repository on port 8765, then run `capture_previews.cjs` using an existing Playwright installation on `NODE_PATH`. Set `PREVIEW_BROWSER` to an installed Chromium executable if needed. No website dependency is added. The capture checks all four pages, four designs and two appearances at 1440px, 1024px, 768px and 390px. For Swiss it also compares menu position, width, direction and typography, plus heading typography, against Home at every size. It verifies image loading, horizontal overflow and key reference layout relationships, and exercises teaching search, recording filters, playlist filtering and project search in the real browser.

Desktop screenshots go to `images/rendered/`; mobile screenshots and the layout audit go to `output/playwright/` at the repository root. `PREVIEW_BASE` can target the public preview and `CHECK_ONLY=1` avoids overwriting screenshots during a deployment check.

# Homepage options with full biography and conversations

This preview keeps all three biography paragraphs and every biography link from the current homepage. It includes the original IIIT-Delhi AlumX and TEDxConversations videos and their real thumbnails. The user confirmed those two videos on 4 October 2026.

Open `index.html` through an HTTP server, or use the published preview. The toolbar switches between four styles, four pages and light, dark or system appearance. Home, Teaching, the video directory and Open Source all keep the chosen style as you navigate. Each combination has a shareable URL. The production homepage and teaching layout are unchanged.

- **Swiss red:** compact sidebar, full bio on the left, portrait and conversations on the right.
- **Warm editorial:** serif typography, a broad biography and a pair of conversations below.
- **Scientific index:** compact navigation and a research/teaching index alongside the biography.
- **Forest notebook:** a green palette and compact sidebar, with the conversations below the biography.

Research and teaching keep illustrated links. Teaching reuses `images/teaching/cover-atlas-01.webp`; research uses a matching atlas generated with the built-in image-generation tool. The illustrations are conceptual, not documentation of specific equipment or facilities. In dark mode they retain their paper backgrounds and original colors.

Generated comparison boards are visual explorations. The HTML preview is the source of truth for exact wording, links and interactions. The generated boards may differ in minor layout and text details.

`build_preview.py` refreshes the complete biography and profile links directly from the production homepage without rewriting them. The original videos are listed in `content.json`. Rebuild with:

```sh
python3 design-explorations/homepage-themes-2026/round-2/build_preview.py
python3 design-explorations/homepage-themes-2026/round-2/build_resources.py
```

Run `verify.cjs` with an existing `jsdom` installation on `NODE_PATH`. It verifies exact bio preservation, video destinations, illustrations, all four styles and all three appearance modes, URL state and local assets.

`build_resources.py` reads the committed versions of the teaching and Open Source pages, preserving their content and functionality while applying the chosen preview colors and typography. `verify_resources.cjs` checks all four styles and both explicit appearance modes on those pages, including search, filters, pagination and cross-page navigation.

Design tokens in `preview.css` pair each light palette with its dark counterpart. The same tokens can later be applied to the existing teaching layout and other local pages once a direction is selected. External sites keep their own themes.

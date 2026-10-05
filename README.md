# nipunbatra.github.io

Personal website for Nipun Batra - Associate Professor, Computer Science, IIT Gandhinagar.

**Live site:** https://nipunbatra.github.io

## Structure

```
├── index.html      # Home page
├── teaching.html   # This semester, one row per course, playlists and cheatsheets
├── teaching-videos.html # Searchable teaching video directory
├── teaching.css / teaching.js # Teaching page styles and filters
├── site.css / site.js # Swiss red layout and the sun and moon light/dark switch
├── projects.html / projects.css / projects.js # Searchable open-source index in three-column sections
├── *-in-*-minute*.html # Individual teaching video series
├── series.css / series.js # Video-series styles and search
├── data/teaching/catalog.json # Curated courses, collections and accessible videos
├── data/teaching/cheatsheets.json # Course associations and individual PDF links
├── teaching-cheatsheets/ # PDFs not yet available from the course websites
├── scripts/build_teaching.py # Generates both teaching pages
├── scripts/build_site.py # Refreshes the shared shell on all nine main pages
├── scripts/site_layout.py # Shared document metadata, menu and footer
├── common.css      # Base resource-page styles
├── images/         # Profile photo and teaching illustrations
└── old/            # Archived Quarto-based site
```

## Design and page content

The main site uses the selected Swiss red design: a shared left navigation on
desktop, a compact header on smaller screens, and the same typography throughout.
The desktop shell grows up to 1,240px on large monitors. Home shows the full
biography and profile links with the portrait at the right, then Research and
Teaching side by side (three illustrated rows each), then the two conversation
videos. Teaching has one search box, a jump strip, a "This semester" feature,
one row per course with a chip for each offering (filled: teaching now; red
outline: lectures recorded; §: cheatsheets), a playlist grid grouped by section
and the cheatsheets listed once. Open source lists each section as a three-column
grid of entries with tag boxes.
The sun and moon switch below the navigation follows the system setting until it
is clicked; the explicit light or dark choice then persists between pages
(`localStorage` key `theme`). The reference mockups for this layout are in
`design-explorations/refined-index-2026/`. The archived alternatives remain in
`design-explorations/` and are not dependencies of the production site.

Edit homepage, project and video-series content inside their root HTML `<main>`
elements. Run `python3 scripts/build_site.py` to refresh navigation, metadata and
footers across all nine pages; it also rebuilds Teaching from its JSON sources.
The build uses Python's standard library and is safe to repeat.

Run `node scripts/test_site.cjs` for shared navigation, content, metadata and
appearance checks (uses `jsdom`, as below). For browser verification, serve the
repository with `python3 -m http.server 8765 --bind 127.0.0.1`, then run
`node scripts/check_site.cjs` using an existing Playwright installation on
`NODE_PATH`. `SITE_BROWSER` optionally supplies the Chromium executable;
`SITE_BASE` defaults to `http://127.0.0.1:8765/` and can also check the live site.
Screenshots and layout measurements are saved to `output/site-launch/`.

## Updating teaching

Edit `data/teaching/catalog.json`, then run `python3 scripts/build_teaching.py`.
The build uses Python's standard library. It writes ordinary HTML links for every
course and video; JavaScript adds search, collection filters and pagination.
The first course in the catalog is featured as "This semester"; its optional
`related_collections` adds extra video links there. Offerings are grouped into one
row per course title (`TITLE_ALIASES` in the build merges renamed courses).

Keep semester-specific recording links separate from general topic playlists.
`recordings: false` means no recording link is listed, not that recordings do not
exist. A video may belong to several collections but appears once in the directory.
The catalog contains public teaching resources, including unlisted lectures that
are accessible through an instructor-approved public playlist. It never needs
YouTube credentials in the browser. Every available teaching playlist appears on the landing page, including
course recordings and the public “Seven Ideas in Machine Learning” playlist.
Lab promotion and research collections are not part of the teaching catalog.

Edit `data/teaching/cheatsheets.json` to update the course groups and PDF links.
Each sheet is indexed by title and course in the shared search. Working course-site
PDF links are retained; sheets whose original URLs were unavailable are served
from `teaching-cheatsheets/`. Course and lecture-library links preserve context.

Run `node --check teaching.js` and `node scripts/test_teaching.cjs` after changes.
The latter uses an existing `jsdom` installation (set `NODE_PATH` to its
`node_modules` directory if it is outside this repository).

## Deployment

Static HTML deployed via GitHub Pages using GitHub Actions. Pushes to `main` trigger automatic deployment.

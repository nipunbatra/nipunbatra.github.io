# nipunbatra.github.io

Personal website for Nipun Batra - Associate Professor, Computer Science, IIT Gandhinagar.

**Live site:** https://nipunbatra.github.io

## Structure

```
├── index.html      # Home page
├── teaching.html   # Courses by semester and video collections
├── teaching-videos.html # Searchable teaching video directory
├── teaching.css / teaching.js # Teaching page styles and filters
├── data/teaching/catalog.json # Curated courses, collections and accessible videos
├── data/teaching/cheatsheets.json # Course associations and individual PDF links
├── teaching-cheatsheets/ # PDFs not yet available from the course websites
├── scripts/build_teaching.py # Generates both teaching pages
├── common.css      # Shared styles
├── images/         # Profile photo and teaching illustrations
└── old/            # Archived Quarto-based site
```

## Updating teaching

Edit `data/teaching/catalog.json`, then run `python3 scripts/build_teaching.py`.
The build uses Python's standard library. It writes ordinary HTML links for every
course and video; JavaScript adds search, collection filters and pagination.

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

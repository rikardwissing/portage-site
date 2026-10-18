# portage.rikard.dev

Marketing site for Portage, the media-server player and downloader for
iPhone, iPad and Mac. Plain HTML and CSS, served by GitHub Pages from `main`.

- `src/` — the source of every page. `layout.html` holds the head, nav and
  footer, `get.html` the closing Get Portage block, `badge.html` the App Store
  badge, and `pages/` one file per page, built at its own path
  (`pages/guides/hotel-tv.html` → `/guides/hotel-tv/`): a few `key: value` fields on top
  (title, description, og_title, og_description, body, lastmod), a blank line,
  then the page's HTML. `{{badge}}` and `{{get}}` in a page pull in the shared
  pieces, and JSON-LD blocks in a page go into its head
- `src/releases.json` — each live App Store version's notes, newest first,
  copied from the App Store. It builds What's new (`{{releases}}`) and the
  homepage's latest-release line (`{{latest_release}}`); add a version at the
  top once it's live
- `scripts/build.py` — builds every page from `src/` to its address
  (`index.html`, `plex/index.html`, …), writes `sitemap.xml` from the pages'
  `lastmod` fields, and writes the redirect pages in `REDIRECTS`. Python's
  standard library only: run `python3 scripts/build.py` and commit the output
  with the source. `MACOS` is the minimum macOS every page states (`{{macos}}`).
  Every App Store link carries a campaign token named after
  its page (`ct=site-plex`)
- `scripts/indexnow.sh` — tells Bing and the other IndexNow engines about
  changed pages after a deploy: no arguments sends every sitemap URL, or
  pass paths like `/xbox/`. The key file at the root must stay
- `img/` — brand assets and screenshots, made from the app repo's
  `appstore/raw/` captures: device shots are composited into Apple's
  frames (`appstore/frames/`, never published bare), the ribbon loop comes
  from the app repo's composer, and the tour is the promo video

App: https://apps.apple.com/app/id6816252844

# rodarly.me

Static portfolio built from wireframes **3** (one-pager, desktop `3a` / mobile `3b`) and
**4** (project detail, desktop `4a` / mobile `4b`) of the *Portfolio Wireframes* design canvas.

No build step, no dependencies. Open `index.html` or serve the folder:

```sh
python -m http.server 8000
```

## Files

```
index.html              one-pager  — wireframe 3a / 3b
project.html            detail page — wireframe 4a / 4b (?p=<slug>)
assets/css/base.css     tokens, theme, header/footer, shared primitives
assets/css/home.css     hero + activity panel, project cards, contact
assets/css/project.css  detail hero, facts rail, deep-dive sections, lightbox, action bar
assets/css/chat.css     ask-me panel (inline card / mobile pull-up sheet)
assets/js/data.js       ← all content lives here
assets/js/ui.js         theme, mobile nav, data bindings
assets/js/github.js     live contribution graph, stats, public event feed
assets/js/hero.js       hero entrance, pointer light, bio expander, copy address
assets/js/chat.js       chat panel + local fallback answers
assets/js/home.js       project cards, mail links
assets/js/project.js    renders one project, TOC scrollspy, lightbox, action bar
assets/media/           portrait, résumé, videos, screenshots, diagrams
```

## Filling it in

Everything editable is in **`assets/js/data.js`**. The static copy in `index.html`
mirrors the defaults so the page reads sensibly before JS runs; `data.js` wins at runtime
via `data-bind` / `data-bind-attr` attributes.

Add a project by appending to `SITE.projects`. Its `slug` becomes the detail URL
(`project.html?p=your-slug`), the home page grows a card, and the "next project"
link at the foot of each detail page rotates through the list.

## Media

Drop these into `assets/media/` — nothing is shipped, and anything missing degrades to a
flat wireframe box rather than a broken image:

- `portrait.jpg`, `resume.pdf`
- `<slug>.mp4` + `<slug>-poster.jpg` — card demo loops muted; the detail page reuses the
  same file with controls
- `<slug>-screen-1.jpg`, `-2.jpg` — the rail thumbnails, click to lightbox
- `<slug>-arch.svg` — the "how it's built" diagram

## The two integrations

**Live GitHub activity** — `SITE.github`, rendered by `assets/js/github.js`. Real, and it
keeps itself current: while the page is open it re-reads GitHub every
`graphRefreshSeconds` (60) and the event feed every `eventsRefreshSeconds` (180), pausing
on a hidden tab and catching up when the tab is focused again. Push a commit, leave the
page open, and the graph, the totals and the streaks move on their own — no rebuild, no
deploy, no token in the page.

- **The graph** reads a public CORS-open mirror of the profile contribution graph
  (`contributionEndpoints`, tried in order, first to answer wins). Because it mirrors the
  profile, **private-repo commits count** — as long as GitHub → Settings → Profile →
  *Include private contributions on my profile* is on.
- **The feed** reads `https://api.github.com/users/<handle>/events/public`, which by
  definition only carries public activity, so pushes to private repos never appear in it.
  With nothing public to show it says so and points at the graph. The unauthenticated
  events API allows 60 calls an hour per IP; keep `eventsRefreshSeconds` at 120 or higher.
- Any endpoint of your own returning `{ contributions: [{ date, count, level }] }` can go
  in `contributionEndpoints` instead. `{handle}` in a URL is substituted.
- To put private commit *messages* on the page, a workflow in the private repo has to
  publish a summary somewhere public (a gist, a small JSON file in a public repo) and that
  URL becomes the feed endpoint. Nothing else can read private history from a static page.

**Ask-me chat** — `SITE.chatEndpoint`. Leave `null` and the panel answers locally with
keyword matching over `data.js` (stack, availability, contact, per-project questions).
Point it at your own endpoint to get real answers: it POSTs
`{ message, history, project }` and expects `{ reply }`.

## Behaviour worth knowing

- **Activity panel** — lives in the right half of the hero (it drops below the
  identity block under 1240px). The dot next to the heading reads *live* while polling is healthy
  and *retrying* (with exponential backoff) when GitHub or the mirror is unreachable; the
  last good data stays on screen either way. A contribution that lands while you are
  watching flashes its cell and shows a `+n just now` note.
- **Theme** — dark by default, as drawn in the wireframe; the
  ☀/◐ toggle switches to light and persists the choice to `localStorage`.
- **Chat** — an inline card at ≥861px; a fixed pull-up sheet below that, expanded by tap,
  drag or focus. On the detail page the sheet stays hidden until the action bar's
  **Ask** button summons it.
- **Detail page** — the demo sits beside the write-up: its framed card and the "jump to"
  links stick in the wider column while the sections scroll next to it, and the link for
  the current section is highlighted. Below 981px they stack, demo first. Below 861px the facts card becomes
  the pill strip under the title and the actions move to the sticky bottom bar (`4b`).
- Reduced-motion preferences disable card autoplay and smooth scrolling.

## Not implemented

Wireframe **4c** (detail as an overlay sheet over the one-pager) is an alternative to
`4a`/`4b`, not an addition — the real-page version is what is built here.

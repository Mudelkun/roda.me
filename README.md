# rodarly.me

My personal portfolio: who I am, what I've built, and how to reach me.

A hand-written static site in plain HTML, CSS and JavaScript. No framework, no build step, no dependencies.

![The home page: profile, live GitHub commit history and project cards](docs/home.jpg)

## Features

- **Live GitHub activity.** A contribution graph, streaks and a public event feed that refresh on their own while the page is open.
- **One page per project.** Each project has its own address (`/formel`, `/louvo`) with a write-up, grouped features,
  stack logos, a screenshot lightbox and a table of contents that follows your scroll.
- **Per-project branding.** A project page and its card can use that product's own colours and fonts.
- **English / French switch.** The live page is translated in place, so there is no second copy of the text to keep in sync.
- **Ask-me chat panel.** Answers questions about my stack, projects and availability from the site's own content,
  or from an API endpoint if one is configured.
- **Built with care for every visitor.** Dark and light themes, a mobile layout with a pull-up chat sheet and a sticky action bar,
  and animations that switch off when the visitor prefers reduced motion.

![A project page: Formel, with the facts card, screenshots and write-up](docs/project.jpg)

## Projects featured

| Project | What it is | Links |
| --- | --- | --- |
| **Formel** | A school management platform running my family's private school in Haiti, used by more than 400 people | Private codebase |
| **Louvo** | An AI hairstyle try-on: upload a selfie and see yourself with any haircut | [louvo.app](https://www.louvo.app) · [source](https://github.com/Mudelkun/Louvo) |

## Run it locally

```sh
python -m http.server 8000
# then open http://localhost:8000
```

Any static file server works, including VS Code's Live Server.

## How it's organized

```
index.html              home page: hero, live activity, project cards, contact
project.html            template for the project pages
formel.html, louvo.html generated from project.html by tools/build-pages.js
assets/js/data.js       all of the site's content: profile, projects, settings
assets/js/ui.js         theme, mobile nav, binds data.js into the page
assets/js/github.js     live contribution graph, stats and event feed
assets/js/project.js    renders a project page: sections, lightbox, scrollspy
assets/js/brand.js      per-project colours, fonts and motion
assets/js/i18n.js       the EN/FR switch
assets/js/chat.js       the ask-me panel
assets/css/             base tokens and theme, then one stylesheet per area
assets/media/           portrait, résumé, logos and screenshots
tools/                  build-pages.js and warm-i18n.js (Node, no dependencies)
```

## Editing the content

Everything is in [`assets/js/data.js`](assets/js/data.js). The HTML repeats the defaults so the page reads correctly
before JavaScript runs, and `data.js` takes over at runtime through `data-bind` attributes.

**Adding a project.** Append it to `SITE.projects`, then generate its page:

```sh
node tools/build-pages.js
```

This writes `<slug>.html` from `project.html` with the project's title and description filled in, so links shared
on social media preview the right project. It also deletes pages for projects that no longer exist. Re-run it
whenever `project.html` changes. GitHub Pages, Netlify and Cloudflare Pages serve `/<slug>` from `<slug>.html`
with no setup (on Vercel, set `"cleanUrls": true`).

**Updating the résumé.** Replace `assets/media/resume.pdf`, keeping the same filename.

**The French translation.** `i18n.js` sends any text it hasn't seen before to a free translation service and caches the result.
To ship translations with the site so visitors don't wait for them, run this after changing content and commit the result:

```sh
node tools/warm-i18n.js          # --check lists what's missing, --force redoes everything
```

Settings live in `SITE.translate`: which services to use, names that must never be translated,
and overrides for short labels a machine translates badly.

## Integrations

**GitHub activity** (`SITE.github`). The graph reads a public, CORS-enabled mirror of the GitHub
contribution graph, so private-repo commits count as long as *Include private contributions on my profile* is on.
The feed reads GitHub's public events API, which only shows public activity and allows 60 requests an hour per visitor,
so keep `eventsRefreshSeconds` at 120 or more. Polling pauses while the tab is hidden and backs off when a request fails.

**Chat** (`SITE.chatEndpoint`). Leave it `null` and the panel answers locally by matching keywords against `data.js`.
Point it at your own endpoint for real answers: the panel sends a POST with `{ message, history, project }` and expects `{ reply }` back.

## Author

**Rodarly Perilus**, full-stack developer and computer science student in Moncton, NB.
[GitHub](https://github.com/Mudelkun) · [perilusrodarly@gmail.com](mailto:perilusrodarly@gmail.com)

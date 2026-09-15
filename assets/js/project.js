/* Project detail page: renders one project from data.js into the 4a/4b layout,
   plus the on-this-page rail, the screens lightbox and the mobile action bar. */

(function () {
  "use strict";

  var SITE = window.SITE || {};
  var UI = window.UI;
  var esc = UI.esc;

  function currentSlug() {
    var slug = new URLSearchParams(window.location.search).get("p");
    return slug || (SITE.projects && SITE.projects[0] && SITE.projects[0].slug);
  }

  function findProject(slug) {
    return (SITE.projects || []).filter(function (p) { return p.slug === slug; })[0];
  }

  function nextProject(project) {
    var list = SITE.projects || [];
    if (list.length < 2) return null;
    var i = list.indexOf(project);
    return list[(i + 1) % list.length];
  }

  function pills(items) {
    return items.map(function (t) { return '<li><span class="pill">' + esc(t) + "</span></li>"; }).join("");
  }

  /* Blank lines in the copy start a new paragraph. */
  function paras(text) {
    return String(text).split(/\n\s*\n/).map(function (p) { return "<p>" + esc(p.trim()) + "</p>"; }).join("");
  }
  /* Features grouped by area: tabs show one area at a time, so a long list never lands
     all at once. Every panel is in the markup; initFeatureGroups switches between them. */
  function featureGroupsHtml(groups) {
    var n = groups.length;
    function icon(key) { return (window.Icons && Icons.feature(key)) || ""; }
    function label(g) { return g.short || g.name; }

    var tabs = groups.map(function (g, i) {
      return '' +
        '<button class="fgroups__tab" type="button" role="tab" id="fg-tab-' + i + '" aria-controls="fg-panel-' + i + '" ' +
          'aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '">' +
          '<span class="fgroups__tab-ic" aria-hidden="true">' + icon(g.icon) + "</span>" +
          '<span class="fgroups__tab-name">' + esc(label(g)) + "</span>" +
        "</button>";
    }).join("");

    var panels = groups.map(function (g, i) {
      var prev = i > 0
        ? '<button class="fgroups__nav" type="button" data-fg-go="' + (i - 1) + '">← ' + esc(label(groups[i - 1])) + "</button>"
        : "<span></span>";
      var next = i < n - 1
        ? '<button class="fgroups__nav" type="button" data-fg-go="' + (i + 1) + '">Next: ' + esc(label(groups[i + 1])) + " →</button>"
        : "";
      return '' +
        '<div class="fgroups__panel" role="tabpanel" id="fg-panel-' + i + '" aria-labelledby="fg-tab-' + i + '"' + (i ? " hidden" : "") + ">" +
          '<div class="fgroups__head">' +
            '<h3 class="fgroups__name">' + esc(g.name) + "</h3>" +
          "</div>" +
          (g.intro ? '<p class="fgroups__intro">' + esc(g.intro) + "</p>" : "") +
          '<ul class="fgroups__list">' + g.items.map(function (item, j) {
            /* An item is { icon, text }, or plain text with a check mark. */
            var text = typeof item === "string" ? item : item.text;
            var mark = (typeof item === "string" ? "" : icon(item.icon)) || icon("check");
            return '<li style="--i:' + j + '"><span class="fgroups__ic" aria-hidden="true">' + mark + "</span><span>" + esc(text) + "</span></li>";
          }).join("") + "</ul>" +
          '<div class="fgroups__foot">' + prev + next + "</div>" +
        "</div>";
    }).join("");

    return '<div class="fgroups" data-fgroups>' +
      '<div class="fgroups__tabs" role="tablist" aria-label="Feature areas">' + tabs + "</div>" +
      panels + "</div>";
  }

  /* ---------- sections ---------- */

  function sections(project) {
    var list = [];

    if (project.description) list.push({ id: "overview", title: "Short description", html: paras(project.description) });
    if (project.whatItDoes) list.push({ id: "what", title: "What it does", html: paras(project.whatItDoes) });
    if (project.whyIBuiltIt) list.push({ id: "why", title: "Why I built it", html: paras(project.whyIBuiltIt) });

    if (project.featureGroups && project.featureGroups.length) {
      list.push({ id: "features", title: "Key features", html: featureGroupsHtml(project.featureGroups) });
    } else if (project.features && project.features.length) {
      list.push({
        id: "features",
        title: "Key features",
        html: '<ul class="features">' + project.features.map(function (f) {
          return '' +
            '<li class="feature" data-glow>' +
              '<span class="feature__ic" aria-hidden="true">' + ((window.Icons && Icons.feature(f.icon)) || esc(f.icon || "◆")) + "</span>" +
              '<span class="feature__body">' +
                '<span class="feature__name">' + esc(f.name) + "</span>" +
                "<p>" + esc(f.text) + "</p>" +
              "</span>" +
            "</li>";
        }).join("") + "</ul>"
      });
    }

    if (project.stack && project.stack.length) {
      list.push({
        id: "stack",
        title: "Tech stack",
        html: '<div class="layers">' + project.stack.map(function (layer) {
          return '' +
            '<div class="layer">' +
              '<h3 class="h-sub">' + esc(layer.layer) + "</h3>" +
              '<ul class="stack-tags">' + layer.items.map(function (t) {
                var logo = window.Icons ? Icons.logo(t) : "";
                var site = window.Icons ? Icons.site(t) : "";
                if (!site) return '<li><span class="pill">' + logo + esc(t) + "</span></li>";
                return '<li><a class="pill pill--link" href="' + esc(site) + '" target="_blank" rel="noopener" ' +
                  'aria-label="' + esc(t) + ' website (opens in a new tab)">' +
                  logo + esc(t) + '<span class="pill__ext" aria-hidden="true">↗</span></a></li>';
              }).join("") + "</ul>" +
            "</div>";
        }).join("") + "</div>"
      });
    }

    if (project.howItsBuilt || (project.architecture && project.architecture.image)) {
      var arch = "";
      if (project.architecture && project.architecture.image) {
        arch = '<figure class="arch" data-frame style="margin:0">' +
          '<img src="' + esc(project.architecture.image) + '" alt="' + esc(project.architecture.caption || "Architecture diagram") + '">' +
          '<figcaption class="note" style="margin-top:8px">' + esc(project.architecture.caption || "") + "</figcaption>" +
          "</figure>";
      }
      list.push({
        id: "built",
        title: "How it's built",
        html: (project.howItsBuilt ? paras(project.howItsBuilt) : "") + arch
      });
    }

    if (project.whatILearned) list.push({ id: "learned", title: "What I learned", html: paras(project.whatILearned) });

    return list;
  }

  /* ---------- blocks ---------- */

  function heroBlock(project) {
    var facts = project.facts || {};
    var rows = Object.keys(facts).map(function (key) {
      var value = esc(facts[key]);
      if (key === "Domain" && project.live) {
        value = '<a href="' + esc(project.live) + '" target="_blank" rel="noopener">' + value + "</a>";
      }
      return '<div class="facts__row"><dt>' + esc(key) + "</dt><dd>" + value + "</dd></div>";
    }).join("");

    var stripItems = [facts.Status, facts.Timeline, facts.Role].filter(Boolean);

    var actions =
      (project.live ? '<a class="btn btn--primary" href="' + esc(project.live) + '" target="_blank" rel="noopener">Try it live →</a>' : "") +
      (project.source ? '<a class="btn" href="' + esc(project.source) + '" target="_blank" rel="noopener">Source on GitHub</a>' : "");

    /* "Name: descriptor" - the descriptor after the colon is set in the accent gradient.
       A long descriptor steps the title down a size so it holds one line. */
    var title = window.Brand ? Brand.title(project.title, esc) : esc(project.title);
    var tail = project.title.split(":")[1] || "";
    var titleClass = "phero__title" + (tail.trim().length > 27 ? " phero__title--long" : "");

    /* The logo links to the live app when there is one; either way it gets the hover lift. */
    var logoClass = "phero__logo" + (project.logoRound ? " phero__logo--round" : "");
    var logoImgs = project.logo
      ? '<img class="' + logoClass + (project.logoDark ? " phero__logo--light" : "") + '" src="' + esc(project.logo) + '" alt="" width="64" height="64">' +
        (project.logoDark ? '<img class="' + logoClass + ' phero__logo--dark" src="' + esc(project.logoDark) + '" alt="" width="64" height="64">' : "")
      : "";
    var logo = !project.logo ? ""
      : project.live
        ? '<a class="phero__logo-link" data-reveal style="--d:.02s" href="' + esc(project.live) + '" target="_blank" rel="noopener" aria-label="Visit ' + esc(project.title.split(":")[0]) + ' (opens in a new tab)">' + logoImgs + "</a>"
        : '<span class="phero__logo-link" data-reveal style="--d:.02s">' + logoImgs + "</span>";

    return '' +
      '<section class="phero" aria-labelledby="p-title">' +
        '<div class="hero__bg" aria-hidden="true">' +
          '<span class="hero__grid"></span>' +
          '<span class="hero__aura"></span>' +
          '<span class="hero__spot"></span>' +
          '<span class="hero__grain"></span>' +
          '<span class="hero__veil"></span>' +
        "</div>" +
        '<div class="shell phero__in">' +
          '<div class="phero__text">' +
            logo +
            '<h1 class="' + titleClass + '" id="p-title" data-reveal style="--d:.1s">' + title + "</h1>" +
            '<ul class="phero__strip stack-tags" data-reveal style="--d:.2s">' + pills(stripItems) + "</ul>" +
          "</div>" +
          '<aside class="facts" aria-label="Project facts" data-reveal style="--d:.22s">' +
            '<h2 class="h-sub">The facts</h2>' +
            '<dl class="facts__rows">' + rows + "</dl>" +
            (actions ? '<div class="facts__actions">' + actions + "</div>" : "") +
          "</aside>" +
        "</div>" +
      "</section>";
  }

  /* No walkthrough video: the demo and screenshots crossfade in its place. */
  function showcaseShots(project) {
    return (project.demo ? [project.demo] : []).concat(project.screens || []);
  }

  function hasShowcase(project) {
    return !project.video && showcaseShots(project).length > 0;
  }

  /* Previous / next screenshot. Brand.slides wires [data-slide-step]. */
  function stepButton(step) {
    var label = step < 0 ? "Previous screenshot" : "Next screenshot";
    var path = step < 0 ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6";
    return '<button class="showcase__step" type="button" data-slide-step="' + step + '" aria-label="' + label + '">' +
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="' + path + '"/></svg></button>';
  }

  /* The media card: the walkthrough video, or the crossfading demo and screenshots. */
  function mediaBlock(project) {
    if (project.video) {
      return '' +
        '<section class="pmedia" aria-label="Walkthrough video">' +
          '<div class="pmedia__head">' +
            '<h2 class="h-sub">Full walkthrough</h2>' +
            (project.videoLength ? '<span class="note">' + esc(project.videoLength) + "</span>" : "") +
          "</div>" +
          '<div class="pmedia__frame pmedia__frame--video" data-frame>' +
            '<video controls preload="metadata" playsinline poster="' + esc(project.poster || "") + '">' +
              '<source src="' + esc(project.video) + '" type="video/mp4">' +
            "</video>" +
          "</div>" +
        "</section>";
    }

    if (!hasShowcase(project)) return "";
    var shots = showcaseShots(project);

    var imgs = shots.map(function (shot, i) {
      return '<img class="bslides__img' + (i === 0 ? " is-active" : "") + '" src="' + esc(shot.src) + '" ' +
        'alt="' + esc(shot.caption || "Screenshot") + '" data-caption="' + esc(shot.caption || "") + '"' +
        (shot.hold ? ' data-hold="' + Number(shot.hold) + '"' : "") + ">";
    }).join("");

    var thumbs = shots.length > 1 ? '<div class="showcase__thumbs" role="group" aria-label="Choose a screenshot">' +
      shots.map(function (shot, i) {
        return '<button class="showcase__thumb' + (i === 0 ? " is-active" : "") + '" type="button" data-slide-to="' + i + '" ' +
          'aria-pressed="' + (i === 0 ? "true" : "false") + '" aria-label="' + esc(shot.caption || "Screenshot " + (i + 1)) + '">' +
          '<img src="' + esc(shot.src) + '" alt="" loading="lazy">' +
          "</button>";
      }).join("") + "</div>" : "";

    return '' +
      '<section class="pmedia' + (project.showcaseDark ? " pmedia--dark" : "") + '" aria-label="Demo" data-slides-scope>' +
        '<div class="pmedia__head">' +
          '<span class="note">Click to enlarge</span>' +
        "</div>" +
        '<button class="pmedia__frame" type="button" id="showcase-frame" data-frame data-slides="4200" aria-label="Enlarge screenshot">' +
          imgs +
        "</button>" +
        '<div class="showcase__bar">' +
          '<p class="note showcase__cap" data-slide-cap>' + esc(shots[0].caption || "") + "</p>" +
          '<div class="showcase__row">' +
            (shots.length > 1 ? stepButton(-1) : "") +
            thumbs +
            (shots.length > 1 ? stepButton(1) : "") +
            (project.live ? '<a class="btn btn--primary pmedia__try" href="' + esc(project.live) + '" target="_blank" rel="noopener">Try it →</a>' : "") +
          "</div>" +
        "</div>" +
      "</section>";
  }

  /* Media beside the write-up: the demo holds the wider column, which stays in view on
     tall enough screens with the section links under it, and the text scrolls beside it. */
  function stageBlock(project, secs) {
    var media = mediaBlock(project);

    var main = secs.map(function (s) {
      return '<section class="psec" id="' + esc(s.id) + '">' +
        '<h2 class="psec__title">' + esc(s.title) + "</h2>" + s.html + "</section>";
    }).join("");

    var toc = secs.length ? '' +
      '<nav class="toc" id="toc" aria-labelledby="toc-title">' +
        '<h2 class="h-sub" id="toc-title">Jump to</h2>' +
        "<ol>" + secs.map(function (s) {
          return '<li><a href="#' + esc(s.id) + '">' + esc(s.title) + "</a></li>";
        }).join("") + "</ol>" +
      "</nav>" : "";

    var screens = "";
    if (project.screens && project.screens.length && !hasShowcase(project)) {
      screens = '' +
        '<section class="screens" aria-labelledby="screens-title">' +
          '<h2 class="h-sub" id="screens-title">Screens</h2>' +
          '<ul class="screens__grid">' + project.screens.map(function (s, i) {
            return '<li><button class="screens__btn" type="button" data-shot="' + i + '" data-frame>' +
              '<img src="' + esc(s.src) + '" alt="' + esc(s.caption || "Screenshot") + '" loading="lazy">' +
              "</button></li>";
          }).join("") + "</ul>" +
          '<p class="note">Click to enlarge</p>' +
        "</section>";
    }

    return '' +
      '<div class="shell pstage' + (media ? "" : " pstage--solo") + '">' +
        (media ? '<div class="pstage__media">' + media + toc + "</div>" : "") +
        '<div class="pstage__text">' +
          (media ? "" : toc) + main + screens +
          '<div id="chat-mount"></div>' +
        "</div>" +
      "</div>";
  }

  function nextBlock(project) {
    var next = nextProject(project);
    var card = "";
    if (next) {
      card = '' +
        '<a class="pnext__card" href="project.html?p=' + encodeURIComponent(next.slug) + '">' +
          '<span><span class="pnext__label">Next project</span><br><span class="pnext__name">' + esc(next.title) + "</span></span>" +
          '<img class="pnext__thumb" src="' + esc(next.poster || "") + '" alt="" data-frame>' +
          '<span aria-hidden="true">→</span>' +
        "</a>";
    }
    return '<div class="shell pnext"><a class="btn" href="index.html#projects">← All projects</a>' + card + "</div>";
  }

  function actionBar(project) {
    return '' +
      '<div class="actionbar">' +
        (project.live ? '<a class="btn btn--primary" href="' + esc(project.live) + '" target="_blank" rel="noopener">Try it live →</a>' : "") +
        (project.source ? '<a class="btn" href="' + esc(project.source) + '" target="_blank" rel="noopener">Source</a>' : "") +
        '<button class="btn btn--ask" type="button" id="ask-btn" aria-label="Ask about this build">Ask</button>' +
      "</div>";
  }

  /* ---------- behaviour ---------- */

  function initToc(secs) {
    var links = UI.$$("#toc a");
    if (!links.length || !("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.setAttribute("aria-current", a.getAttribute("href") === "#" + entry.target.id ? "true" : "false");
        });
      });
    }, { rootMargin: "-78px 0px -70% 0px", threshold: 0 });

    secs.forEach(function (s) {
      var node = document.getElementById(s.id);
      if (node) observer.observe(node);
    });
  }

  /* Tabs for grouped features: click, arrow keys, Home/End, or the prev/next links under
     a panel. Switching replays the panel's entrance so the change reads at a glance. */
  function initFeatureGroups(root) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-fgroups]"), function (box) {
      var tabs = Array.prototype.slice.call(box.querySelectorAll('[role="tab"]'));
      var panels = Array.prototype.slice.call(box.querySelectorAll('[role="tabpanel"]'));

      function select(i, focus) {
        i = (i + tabs.length) % tabs.length;
        tabs.forEach(function (tab, j) {
          tab.setAttribute("aria-selected", j === i ? "true" : "false");
          tab.tabIndex = j === i ? 0 : -1;
          panels[j].hidden = j !== i;
        });
        panels[i].classList.remove("is-in");
        void panels[i].offsetWidth;
        panels[i].classList.add("is-in");
        if (focus) tabs[i].focus();
      }

      tabs.forEach(function (tab, i) {
        tab.addEventListener("click", function () { select(i); });
        tab.addEventListener("keydown", function (e) {
          var to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
          if (to === undefined) return;
          e.preventDefault();
          select(to, true);
        });
      });

      Array.prototype.forEach.call(box.querySelectorAll("[data-fg-go]"), function (btn) {
        btn.addEventListener("click", function () { select(Number(btn.getAttribute("data-fg-go")), true); });
      });
    });
  }

  function initLightbox(project) {
    var dialog = document.getElementById("lightbox");
    var img = document.getElementById("lightbox-img");
    var cap = document.getElementById("lightbox-cap");
    var close = document.getElementById("lightbox-close");
    if (!dialog || !dialog.showModal) return;

    /* Previous / next + a counter, added here so the dialog markup stays as it is. */
    function stepBtn(step) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "lightbox__step lightbox__step--" + (step < 0 ? "prev" : "next");
      b.setAttribute("aria-label", step < 0 ? "Previous screenshot" : "Next screenshot");
      b.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (step < 0 ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6") + '"/></svg>';
      b.addEventListener("click", function (e) { e.stopPropagation(); go(index + step); });
      dialog.appendChild(b);
      return b;
    }
    var prev = stepBtn(-1);
    var next = stepBtn(1);
    var count = document.createElement("span");
    count.className = "lightbox__count";
    cap.parentNode.insertBefore(count, cap);

    var list = [];
    var index = 0;
    var fromShowcase = false;

    function go(i) {
      if (!list.length) return;
      index = (i + list.length) % list.length;
      var shot = list[index];
      img.src = shot.src;
      img.alt = shot.caption || "Screenshot";
      cap.textContent = shot.caption || "";
      count.textContent = list.length > 1 ? (index + 1) + " / " + list.length : "";
      // Keep the slideshow behind in step, so closing lands on the same screenshot.
      if (fromShowcase) {
        var thumb = document.querySelector('[data-slide-to="' + index + '"]');
        if (thumb) thumb.click();
      }
    }

    function open(shots, i, showcase) {
      list = shots || [];
      fromShowcase = !!showcase;
      prev.hidden = next.hidden = list.length < 2;
      go(i);
      if (!dialog.open) dialog.showModal();
    }

    UI.$$(".screens__btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        open(project.screens, Number(btn.dataset.shot), false);
      });
    });

    var frame = document.getElementById("showcase-frame");
    if (frame) {
      frame.addEventListener("click", function () {
        open(showcaseShots(project), Number(frame.getAttribute("data-index")) || 0, true);
      });
    }

    dialog.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
    });

    close.addEventListener("click", function () { dialog.close(); });
    /* .lightbox__in fills the whole dialog, so a click on the dialog itself never happens -
       close on any click that is not on the image or a control. Escape closes it natively. */
    dialog.addEventListener("click", function (e) {
      if (!e.target.closest("img, #lightbox-close, .lightbox__step")) dialog.close();
    });
  }

  function notFound() {
    var links = (SITE.projects || []).map(function (p) {
      return '<li><a href="project.html?p=' + encodeURIComponent(p.slug) + '">' + esc(p.title) + "</a></li>";
    }).join("");

    return '<div class="shell" style="padding-block:60px;display:flex;flex-direction:column;gap:14px">' +
      '<h1 class="h-sec">Project not found</h1>' +
      '<p class="lede">That link does not match a project.</p>' +
      (links ? "<ul>" + links + "</ul>" : "") +
      '<p><a class="btn" href="index.html#projects">← All projects</a></p></div>';
  }

  /* ---------- boot ---------- */

  document.addEventListener("DOMContentLoaded", function () {
    var year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());

    var root = document.getElementById("project-root");
    var project = findProject(currentSlug());

    if (!project) {
      root.innerHTML = notFound();
      return;
    }

    var owner = (SITE.profile && SITE.profile.name) || "";
    document.title = project.title + (owner ? " — " + owner : "");
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", project.pitch || project.summary || "");

    var crumbs = document.getElementById("crumbs");
    if (crumbs) {
      crumbs.innerHTML = '<a href="index.html">Home</a><span class="crumbs__sep">/</span>' +
        '<a href="index.html#projects">Projects</a><span class="crumbs__sep">/</span>' + esc(project.title);
    }

    var secs = sections(project);

    root.innerHTML = heroBlock(project) + stageBlock(project, secs) + nextBlock(project);
    document.body.insertAdjacentHTML("beforeend", actionBar(project));
    document.body.classList.add("has-actionbar");
    if (window.HeroFx) HeroFx.bind(root.querySelector(".phero"));

    UI.initBindings(root);
    UI.initMediaFallback(root);
    initToc(secs);
    initFeatureGroups(root);
    initLightbox(project);
    if (window.Brand) Brand.slides(root);

    var chat = window.mountChat(document.getElementById("chat-mount"), {
      id: "chat-project",
      title: "Ask about this build",
      blurb: "Answers drawn from this project's write-up.",
      project: project,
      summoned: true
    });

    var ask = document.getElementById("ask-btn");
    if (ask) ask.addEventListener("click", function () { chat.summon(); });
  });
})();

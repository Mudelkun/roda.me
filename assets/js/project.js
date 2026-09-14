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

  /* ---------- sections ---------- */

  function sections(project) {
    var list = [];

    if (project.whatItDoes) list.push({ id: "what", title: "What it does", html: "<p>" + esc(project.whatItDoes) + "</p>" });
    if (project.whyIBuiltIt) list.push({ id: "why", title: "Why I built it", html: "<p>" + esc(project.whyIBuiltIt) + "</p>" });

    if (project.features && project.features.length) {
      list.push({
        id: "features",
        title: "Key features",
        html: '<ul class="features">' + project.features.map(function (f) {
          return '' +
            '<li class="feature" data-glow>' +
              '<span class="feature__ic" aria-hidden="true">' + esc(f.icon || "◆") + "</span>" +
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
              '<ul class="stack-tags">' + pills(layer.items) + "</ul>" +
              (layer.why ? '<p class="layer__why">' + esc(layer.why) + "</p>" : "") +
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
        html: (project.howItsBuilt ? "<p>" + esc(project.howItsBuilt) + "</p>" : "") + arch
      });
    }

    if (project.whatILearned) list.push({ id: "learned", title: "What I learned", html: "<p>" + esc(project.whatILearned) + "</p>" });

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
      '<a class="btn btn--primary" href="' + esc(project.live) + '" target="_blank" rel="noopener">Try it live →</a>' +
      (project.source ? '<a class="btn" href="' + esc(project.source) + '" target="_blank" rel="noopener">Source on GitHub</a>' : "");

    return '' +
      '<section class="phero ground" aria-labelledby="p-title">' +
        '<div class="ground__roads" aria-hidden="true"><i></i><i></i><i></i></div>' +
        '<div class="shell phero__in">' +
          '<div class="phero__text">' +
            (project.logo
              ? '<img class="phero__logo" src="' + esc(project.logo) + '" alt="' + esc(project.title.split(":")[0]) + ' logo" width="64" height="64">'
              : "") +
            '<p class="eyebrow" data-brand-reveal style="--i:0">Project ' + esc(project.index) + "</p>" +
            '<h1 class="phero__title" id="p-title" data-brand-reveal style="--i:1">' +
              esc(project.title) + "</h1>" +
            '<p class="lede phero__pitch" data-brand-reveal style="--i:2">' + esc(project.pitch) + "</p>" +
            '<ul class="phero__strip stack-tags">' + pills(stripItems) + "</ul>" +
          "</div>" +
          '<aside class="facts" aria-label="Project facts" data-brand-reveal style="--i:2">' +
            '<h2 class="h-sub">The facts</h2>' +
            '<dl class="facts__rows">' + rows + "</dl>" +
            '<ul class="stack-tags">' + pills((project.tags || []).slice(0, 4)) + "</ul>" +
            '<div class="facts__actions">' + actions + "</div>" +
          "</aside>" +
        "</div>" +
      "</section>";
  }

  function videoBlock(project) {
    if (!project.video) return "";
    return '' +
      '<section class="walkthrough" aria-label="Walkthrough video">' +
        '<div class="shell">' +
          '<div class="walkthrough__frame" data-frame>' +
            '<video controls preload="metadata" playsinline poster="' + esc(project.poster || "") + '">' +
              '<source src="' + esc(project.video) + '" type="video/mp4">' +
            "</video>" +
          "</div>" +
          '<p class="note walkthrough__cap">Full walkthrough' +
            (project.videoLength ? " · " + esc(project.videoLength) : "") + "</p>" +
        "</div>" +
      "</section>";
  }

  /* No walkthrough video: the screenshots take its place as a crossfading stage. */
  function showcaseShots(project) {
    return (project.demo ? [project.demo] : []).concat(project.screens || []);
  }

  function hasShowcase(project) {
    return !project.video && showcaseShots(project).length > 0;
  }

  function showcaseBlock(project) {
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
      '<section class="showcase" aria-label="Screens" data-slides-scope>' +
        '<div class="shell">' +
          '<div class="showcase__stage" data-brand-reveal>' +
            '<button class="showcase__frame" type="button" id="showcase-frame" data-frame data-slides="4200" data-tilt="3" aria-label="Enlarge screenshot">' +
              imgs +
            "</button>" +
          "</div>" +
          '<div class="showcase__bar" data-brand-reveal style="--i:1">' +
            '<p class="note showcase__cap" data-slide-cap>' + esc(shots[0].caption || "") + "</p>" +
            thumbs +
          "</div>" +
        "</div>" +
      "</section>";
  }

  function bodyBlock(project, secs) {
    var main = secs.map(function (s) {
      return '<section class="psec" id="' + esc(s.id) + '" data-brand-reveal>' +
        '<h2 class="psec__title">' + esc(s.title) + "</h2>" + s.html + "</section>";
    }).join("");

    var toc = secs.map(function (s) {
      return '<li><a href="#' + esc(s.id) + '">' + esc(s.title) + "</a></li>";
    }).join("");

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
      '<div class="shell pbody">' +
        '<div class="pbody__main">' + main + "</div>" +
        '<aside class="prail">' +
          '<nav class="toc" id="toc" aria-labelledby="toc-title">' +
            '<h2 class="h-sub" id="toc-title">On this page</h2>' +
            "<ol>" + toc + "</ol>" +
          "</nav>" +
          screens +
          '<div id="chat-mount"></div>' +
        "</aside>" +
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
        '<a class="btn btn--primary" href="' + esc(project.live) + '" target="_blank" rel="noopener">Try it live →</a>' +
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

  function initLightbox(project) {
    var dialog = document.getElementById("lightbox");
    var img = document.getElementById("lightbox-img");
    var cap = document.getElementById("lightbox-cap");
    var close = document.getElementById("lightbox-close");
    if (!dialog || !dialog.showModal) return;

    UI.$$(".screens__btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var shot = project.screens[Number(btn.dataset.shot)];
        if (!shot) return;
        img.src = shot.src;
        img.alt = shot.caption || "Screenshot";
        cap.textContent = shot.caption || "";
        dialog.showModal();
      });
    });

    var frame = document.getElementById("showcase-frame");
    if (frame) {
      frame.addEventListener("click", function () {
        var shot = showcaseShots(project)[Number(frame.getAttribute("data-index")) || 0];
        if (!shot) return;
        img.src = shot.src;
        img.alt = shot.caption || "Screenshot";
        cap.textContent = shot.caption || "";
        dialog.showModal();
      });
    }

    close.addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) dialog.close();
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

    root.innerHTML = heroBlock(project) + videoBlock(project) + showcaseBlock(project) +
      bodyBlock(project, secs) + nextBlock(project);
    document.body.insertAdjacentHTML("beforeend", actionBar(project));
    document.body.classList.add("has-actionbar");

    UI.initBindings(root);
    UI.initMediaFallback(root);
    initToc(secs);
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

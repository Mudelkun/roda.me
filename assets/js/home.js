/* One-pager behaviour: project cards, mail links, the "ask my AI" bars.
   The hero section has its own file, assets/js/hero.js. */

(function () {
  "use strict";

  var SITE = window.SITE || {};
  var UI = window.UI;
  var esc = UI.esc;

  function projectUrl(project) {
    return UI.projectUrl(project.slug);
  }

  function cardMedia(project) {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (project.video) {
      return '' +
        '<div class="pcard__media">' +
          '<div class="pcard__frame" data-frame>' +
            '<div class="pcard__poster" aria-hidden="true"></div>' +
            '<video ' + (reduced ? "" : "autoplay ") + 'muted loop playsinline preload="metadata" ' +
              'poster="' + esc(project.poster || "") + '" ' +
              'aria-label="Demo of ' + esc(project.title) + '">' +
              '<source src="' + esc(project.video) + '" type="video/mp4">' +
            "</video>" +
          "</div>" +
        "</div>";
    }

    /* No demo video: the first screenshot, held still. The detail page has the rest. */
    var shot = (project.screens || [])[0] || (project.poster ? { src: project.poster } : null);

    return '' +
      '<div class="pcard__media">' +
        (shot
          ? '<a class="pcard__frame" href="' + esc(projectUrl(project)) + '" tabindex="-1" aria-hidden="true" data-frame>' +
              '<img src="' + esc(shot.src) + '" alt="">' +
            "</a>"
          : '<div class="pcard__frame" data-frame><div class="pcard__poster" aria-hidden="true"></div></div>') +
      "</div>";
  }

  /* "Formel: School management system" -> what it does as the headline, the name under it. */
  function cardTitle(project) {
    var title = String(project.title || "");
    var cut = title.indexOf(":");
    var name = cut > 0 ? title.slice(0, cut) : title;
    var kind = cut > 0 ? title.slice(cut + 1).trim() : "";
    var logo = project.logo
      ? '<img class="pcard__logo' + (project.logoRound ? " pcard__logo--round" : "") + '" src="' + esc(project.logo) + '" alt="" width="36" height="36">'
      : "";

    return '' +
      '<div class="pcard__head">' +
        logo +
        '<div class="pcard__names">' +
          '<h3 class="pcard__title"><a class="pcard__link" href="' + esc(projectUrl(project)) + '">' + esc(kind || name) + "</a></h3>" +
          (kind ? '<p class="pcard__name"><span class="btitle__tail">' + esc(name) + "</span></p>" : "") +
        "</div>" +
        '<span class="pcard__go" aria-hidden="true">→</span>' +
      "</div>";
  }

  function cardMeta(project) {
    var meta = project.meta || [];
    if (!meta.length) return "";
    return '<p class="pcard__meta">' + meta.map(function (item, i) {
      return i === 0
        ? '<span class="pcard__status"><span class="pcard__dot" aria-hidden="true"></span>' + esc(item) + "</span>"
        : "<span>" + esc(item) + "</span>";
    }).join('<span class="pcard__sep" aria-hidden="true">·</span>') + "</p>";
  }

  function cardStack(project) {
    var tags = project.tags || [];
    if (!tags.length) return "";
    return '<ul class="stack-tags pcard__stack" aria-label="Built with">' + tags.map(function (t) {
      var logo = window.Icons ? Icons.logo(t) : "";
      return '<li><span class="pill">' + logo + esc(t) + "</span></li>";
    }).join("") + "</ul>";
  }

  function cardBody(project) {
    var actions = project.live ? '<a class="btn btn--primary" href="' + esc(project.live) + '" target="_blank" rel="noopener">Try it live ↗</a>' : "";
    if (project.source) {
      actions += '<a class="btn" href="' + esc(project.source) + '" target="_blank" rel="noopener">Source</a>';
    }
    actions += '<a class="btn btn--ghost pcard__more" href="' + esc(projectUrl(project)) + '">View more <span class="pcard__arrow" aria-hidden="true">→</span></a>';

    return '' +
      '<div class="pcard__body">' +
        cardTitle(project) +
        '<p class="lede pcard__pitch">' + esc(project.pitch || project.summary || "") + "</p>" +
        cardMeta(project) +
        cardStack(project) +
        '<div class="pcard__actions">' + actions + "</div>" +
      "</div>";
  }

  function renderProjects() {
    var list = document.getElementById("projects-list");
    if (!list) return;

    var projects = SITE.projects || [];

    if (!projects.length) {
      list.innerHTML = '<li class="note">No projects yet.</li>';
      return;
    }

    list.innerHTML = projects.map(function (project) {
      var brand = project.brand && window.Brand ? Brand.attrs(project.brand, esc) + " data-glow" : "";
      return '<li class="pcard" data-href="' + esc(projectUrl(project)) + '"' + brand + ">" +
        cardMedia(project) + cardBody(project) + "</li>";
    }).join("");

    /* The whole card opens the write-up; its own links and buttons keep their targets,
       and a click that ends a text selection doesn't count. */
    list.addEventListener("click", function (e) {
      var card = e.target.closest(".pcard[data-href]");
      if (!card || e.target.closest("a, button")) return;
      if (String(window.getSelection() || "").trim()) return;
      window.location.href = card.getAttribute("data-href");
    });

    UI.initMediaFallback(list);
    if (window.Brand) Brand.interact(list);
  }

  /* The PROJECTS heading: letters near the cursor lift, lean away and pick up the
     accent, then spring back when it moves on. Each letter runs a small spring so
     the motion overshoots a little instead of snapping. */
  function wireTitleLetters() {
    var title = document.getElementById("projects-title");
    var word = title && title.querySelector(".projects__word");
    if (!word) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var zone = title.parentNode;
    var holder = document.createElement("span");
    holder.className = "projects__letters";
    holder.setAttribute("aria-hidden", "true");
    holder.setAttribute("data-no-i18n", "");
    title.appendChild(holder);
    title.classList.add("is-live");

    var letters = [];
    var pointer = null;
    var frame = 0;

    // Rebuilt whenever the word changes, so the FR switch gets moving letters too.
    function build() {
      holder.textContent = "";
      letters = [];
      word.textContent.trim().split(/\s+/).forEach(function (part, i) {
        if (i) holder.appendChild(document.createTextNode(" "));
        var group = document.createElement("span");
        group.className = "projects__group";
        Array.from(part).forEach(function (ch) {
          var el = document.createElement("span");
          el.className = "projects__letter";
          el.textContent = ch;
          group.appendChild(el);
          letters.push({ el: el, x: 0, y: 0, r: 0, s: 1, p: 0, vx: 0, vy: 0, vr: 0, vs: 0 });
        });
        holder.appendChild(group);
      });
    }

    function spring(l, key, vKey, target) {
      l[vKey] = (l[vKey] + (target - l[key]) * 0.14) * 0.74;
      l[key] += l[vKey];
      return Math.abs(target - l[key]) + Math.abs(l[vKey]);
    }

    function tick() {
      frame = 0;
      var fs = parseFloat(getComputedStyle(title).fontSize) || 60;
      var reach = fs * 1.7;
      var base = title.getBoundingClientRect();
      var moving = 0;

      letters.forEach(function (l) {
        var e = 0, dx = 0, dist = 1;
        if (pointer) {
          // offsetLeft/Top ignore transforms, so the letter's resting centre is stable.
          var cx = base.left + l.el.offsetLeft + l.el.offsetWidth / 2;
          var cy = base.top + l.el.offsetTop + l.el.offsetHeight / 2;
          dx = pointer.x - cx;
          dist = Math.hypot(dx, pointer.y - cy) || 1;
          var t = Math.max(0, 1 - dist / reach);
          e = t * t * (3 - 2 * t);
        }

        moving += spring(l, "y", "vy", -e * fs * 0.24);
        moving += spring(l, "x", "vx", -(dx / dist) * e * fs * 0.1);
        moving += spring(l, "r", "vr", -Math.max(-1, Math.min(1, dx / reach)) * e * 16);
        moving += spring(l, "s", "vs", 1 + e * 0.18);
        l.p += (e - l.p) * 0.2;
        moving += Math.abs(e - l.p);

        l.el.style.transform = "translate(" + l.x.toFixed(2) + "px," + l.y.toFixed(2) + "px) " +
          "rotate(" + l.r.toFixed(2) + "deg) scale(" + l.s.toFixed(3) + ")";
        l.el.style.setProperty("--p", l.p.toFixed(3));
      });

      if (pointer || moving > 0.01) frame = requestAnimationFrame(tick);
    }

    function wake() {
      if (!frame) frame = requestAnimationFrame(tick);
    }

    function track(event) {
      pointer = { x: event.clientX, y: event.clientY };
      wake();
    }

    function release() {
      pointer = null;
      wake();
    }

    zone.addEventListener("pointermove", track);
    zone.addEventListener("pointerdown", track);
    zone.addEventListener("pointerleave", release);
    zone.addEventListener("pointercancel", release);
    zone.addEventListener("pointerup", function (event) {
      if (event.pointerType !== "mouse") release();
    });

    new MutationObserver(build).observe(word, { childList: true, characterData: true, subtree: true });
    build();
  }

  function wireMailLinks() {
    var email = SITE.profile && SITE.profile.email;
    if (!email) return;
    ["hero-email", "contact-email"].forEach(function (id) {
      var node = document.getElementById(id);
      if (node) node.href = "mailto:" + email;
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());

    wireMailLinks();
    wireTitleLetters();
    renderProjects();

    if (window.AskAI) {
      AskAI.init();
      AskAI.bar(document.getElementById("hero-ask"), {
        id: "ask-hero",
        label: "Ask my AI",
        examples: SITE.chatExamples,
        chips: (SITE.chatSuggestions || []).slice(0, 3)
      });
      AskAI.bar(document.getElementById("contact-ask"), {
        id: "ask-contact",
        compact: true,
        placeholder: "Ask a question before you reach out…"
      });
    }
  });
})();

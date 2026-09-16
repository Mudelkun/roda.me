/* One-pager behaviour: project cards, mail links, chat mount.
   The hero section has its own file, assets/js/hero.js. */

(function () {
  "use strict";

  var SITE = window.SITE || {};
  var UI = window.UI;
  var esc = UI.esc;

  /* Summary text: blank lines split paragraphs, **text** is bold. */
  function summaryHtml(text) {
    return String(text || "").split(/\n\s*\n/).map(function (para) {
      return '<p class="lede">' + esc(para.trim()).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") + "</p>";
    }).join("");
  }

  function projectUrl(project) {
    return UI.projectUrl(project.slug);
  }

  function cardMedia(project) {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* The card is a teaser: a handful of screens, the detail page has the rest. */
    var screens = (project.screens || []).slice(0, 8);

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
          '<p class="note">Demo video · muted, loops</p>' +
        "</div>";
    }

    /* No demo video yet: the screenshots crossfade in the frame instead. */
    if (screens.length) {
      var imgs = screens.map(function (shot, i) {
        return '<img class="bslides__img' + (i === 0 ? " is-active" : "") + '" src="' + esc(shot.src) + '" ' +
          'alt="' + esc(shot.caption || "Screenshot") + '" data-caption="' + esc(shot.caption || "") + '"' +
          (i === 0 ? "" : ' loading="lazy"') + ">";
      }).join("");

      var dots = screens.length > 1 ? '<div class="bdots" role="group" aria-label="Screenshots">' +
        screens.map(function (shot, i) {
          return '<button class="bdots__dot' + (i === 0 ? " is-active" : "") + '" type="button" data-slide-to="' + i + '" ' +
            'aria-pressed="' + (i === 0 ? "true" : "false") + '" aria-label="Show screenshot ' + (i + 1) + '"></button>';
        }).join("") + "</div>" : "";

      return '' +
        '<div class="pcard__media" data-slides-scope>' +
          '<a class="pcard__frame pcard__frame--slides" href="' + esc(projectUrl(project)) + '" ' +
            'aria-label="Open the ' + esc(project.title) + ' write-up" data-frame data-slides="3800" data-tilt="5">' +
            imgs +
          "</a>" +
          '<div class="pcard__foot">' +
            dots +
          "</div>" +
        "</div>";
    }

    return '' +
      '<div class="pcard__media">' +
        '<div class="pcard__frame" data-frame>' +
          (project.poster
            ? '<img src="' + esc(project.poster) + '" alt="' + esc(project.title) + ' — screenshot">'
            : '<div class="pcard__poster" aria-hidden="true"></div>') +
        "</div>" +
      "</div>";
  }

  function cardBody(project) {
    var actions = project.live ? '<a class="btn btn--primary" href="' + esc(project.live) + '" target="_blank" rel="noopener">Try it live →</a>' : "";
    if (project.source) {
      actions += '<a class="btn" href="' + esc(project.source) + '" target="_blank" rel="noopener">Source</a>';
    }
    actions += '<a class="btn btn--ghost" href="' + esc(projectUrl(project)) + '">View more →</a>';

    return '' +
      '<div class="pcard__body">' +
        '<h3 class="pcard__title"><a href="' + esc(projectUrl(project)) + '" style="text-decoration:none">' +
          (window.Brand ? Brand.title(project.title, esc) : esc(project.title)) + "</a></h3>" +
        '<div class="pcard__summary">' + summaryHtml(project.summary) + "</div>" +
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
    renderProjects();

    var mount = document.getElementById("chat-mount");
    if (mount) window.mountChat(mount, { id: "chat-home" });
  });
})();

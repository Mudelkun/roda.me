/* Shared behaviour: theme, mobile nav, missing-media fallback, small DOM helpers. */

(function () {
  "use strict";

  var SITE = window.SITE || {};

  /* ---------- helpers ---------- */

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function el(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- theme ---------- */

  var STORE_KEY = "roda-theme";

  function readStoredTheme() {
    try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; }
  }

  function storeTheme(value) {
    try { localStorage.setItem(STORE_KEY, value); } catch (e) { /* private mode */ }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    $$(".theme-toggle").forEach(function (btn) {
      btn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
      btn.setAttribute("aria-label", theme === "light" ? "Switch to dark mode" : "Switch to light mode");
    });
  }

  function initTheme() {
    // Dark is the designed default; light is an opt-in via the toggle.
    applyTheme(readStoredTheme() === "light" ? "light" : "dark");

    $$(".theme-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
        swapTheme(btn, next, function () {
          applyTheme(next);
          storeTheme(next);
        });
      });
    });
  }

  /* ---------- mobile nav ---------- */

  function initNav() {
    var burger = $(".burger");
    var nav = $("#site-nav");
    if (!burger || !nav) return;

    var mq = window.matchMedia("(max-width: 860px)");

    function sync() {
      if (mq.matches) {
        nav.hidden = burger.getAttribute("aria-expanded") !== "true";
      } else {
        nav.hidden = false;
        burger.setAttribute("aria-expanded", "false");
      }
    }

    burger.addEventListener("click", function () {
      burger.setAttribute("aria-expanded", burger.getAttribute("aria-expanded") === "true" ? "false" : "true");
      sync();
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a") && mq.matches) {
        burger.setAttribute("aria-expanded", "false");
        sync();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
        burger.setAttribute("aria-expanded", "false");
        sync();
        burger.focus();
      }
    });

    (mq.addEventListener ? mq.addEventListener.bind(mq, "change") : mq.addListener.bind(mq))(sync);
    sync();
  }

  /* ---------- header motion ---------- */

  var calm = window.matchMedia("(prefers-reduced-motion: reduce)");

  function onChange(mq, fn) {
    (mq.addEventListener ? mq.addEventListener.bind(mq, "change") : mq.addListener.bind(mq))(fn);
  }

  /* Rays burst from where the knob lands, then the new palette spreads out from the switch. */
  function swapTheme(btn, next, commit) {
    if (calm.matches) { commit(); return; }

    var burst = el('<span class="theme-toggle__burst" aria-hidden="true"></span>');
    burst.style.left = (next === "light" ? 16 : 42) + "px";
    for (var i = 0; i < 8; i++) burst.appendChild(el('<i style="--a:' + i * 45 + 'deg"></i>'));
    $$(".theme-toggle__burst", btn).forEach(function (old) { old.remove(); });
    btn.appendChild(burst);
    setTimeout(function () { burst.remove(); }, 700);

    if (!document.startViewTransition) { commit(); return; }

    var r = btn.getBoundingClientRect();
    var x = r.left + r.width / 2;
    var y = r.top + r.height / 2;
    var radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    document.startViewTransition(commit).ready.then(function () {
      document.documentElement.animate(
        { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + radius + "px at " + x + "px " + y + "px)"] },
        { duration: 700, easing: "cubic-bezier(.22, 1, .36, 1)", pseudoElement: "::view-transition-new(root)" }
      );
    }).catch(function () { /* transition skipped - theme is already applied */ });
  }

  function splitBrand() {
    var word = $(".brand [data-bind]");
    if (!word || word.querySelector(".brand__word")) return;
    var text = word.textContent;
    word.innerHTML =
      '<span class="sr">' + esc(text) + "</span>" +
      '<span class="brand__word" aria-hidden="true">' +
        text.split("").map(function (ch, i) { return '<span style="--i:' + i + '">' + esc(ch) + "</span>"; }).join("") +
      "</span>";
  }

  /* The pill follows hover/focus and settles on the section in view. On pages whose nav
     points elsewhere it only follows hover. */
  function initNavMotion() {
    var nav = $("#site-nav");
    var header = $(".site-header");
    if (!nav || !header) return;

    var links = $$(".nav__link", nav);
    if (!links.length) return;
    links.forEach(function (a, i) { a.style.setProperty("--i", i); });

    var wide = window.matchMedia("(min-width: 861px)");
    var pill = el('<span class="nav__pill" aria-hidden="true"></span>');
    nav.appendChild(pill);

    var targets = links.map(function (a) {
      var href = a.getAttribute("href") || "";
      return href.charAt(0) === "#" && href.length > 1 ? document.getElementById(href.slice(1)) : null;
    });
    var inPage = targets.some(Boolean);

    var bar = null;
    if (inPage) {
      bar = el('<span class="site-header__progress" aria-hidden="true"></span>');
      header.appendChild(bar);
    }

    var hovered = null;
    var current = null;
    var locked = null;

    function place() {
      var target = wide.matches ? (hovered || current) : null;
      links.forEach(function (a) { a.classList.toggle("is-lit", a === target); });

      if (!target) { pill.classList.remove("is-on"); return; }

      // Appear in place rather than sliding in from the corner.
      var appearing = !pill.classList.contains("is-on");
      if (appearing) pill.style.transition = "none";
      pill.style.width = target.offsetWidth + "px";
      pill.style.height = target.offsetHeight + "px";
      pill.style.transform = "translate(" + target.offsetLeft + "px, " + target.offsetTop + "px)";
      if (appearing) {
        void pill.offsetWidth;
        pill.style.transition = "";
      }
      pill.classList.add("is-on");
    }

    function spy() {
      if (!inPage) return;
      var active = locked;

      if (!active) {
        var doc = document.documentElement;
        var line = header.offsetHeight + window.innerHeight * 0.3;

        if (window.scrollY + window.innerHeight >= doc.scrollHeight - 4) {
          for (var j = targets.length - 1; j >= 0; j--) if (targets[j]) { active = links[j]; break; }
        } else {
          targets.forEach(function (t, i) {
            if (!t) return;
            var r = t.getBoundingClientRect();
            // A panel sitting beside its parent section (Activity next to About on wide
            // screens) only takes over once the layout stacks it below.
            var host = targets.some(function (o) { return o && o !== t && o.contains(t); });
            if (host && r.left > window.innerWidth * 0.35) return;
            if (r.top <= line) active = links[i];
          });
        }
      }

      if (active === current) return;
      current = active;
      links.forEach(function (a) {
        if (a === current) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
      place();
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        header.classList.toggle("is-scrolled", window.scrollY > 8);
        if (bar) {
          var max = document.documentElement.scrollHeight - window.innerHeight;
          bar.style.setProperty("--p", max > 0 ? Math.min(1, window.scrollY / max) : 0);
        }
        spy();
      });
    }

    links.forEach(function (a, i) {
      a.addEventListener("mouseenter", function () { hovered = a; place(); });
      a.addEventListener("focus", function () { hovered = a; place(); });
      a.addEventListener("click", function () {
        if (!targets[i]) return;
        locked = a;
        spy();
      });
    });
    nav.addEventListener("mouseleave", function () { hovered = null; place(); });
    nav.addEventListener("focusout", function (e) {
      if (!nav.contains(e.relatedTarget)) { hovered = null; place(); }
    });

    // A jump from the nav holds its link lit until the reader scrolls on their own.
    function release() {
      if (!locked) return;
      locked = null;
      onScroll();
    }
    ["wheel", "touchstart", "keydown"].forEach(function (type) {
      window.addEventListener(type, release, { passive: true });
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () { place(); onScroll(); });
    onChange(wide, place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
    onScroll();
  }

  /* ---------- data bindings ---------- */

  function resolve(path) {
    return path.split(".").reduce(function (acc, key) {
      return acc == null ? acc : acc[key];
    }, SITE);
  }

  /* Static markup carries readable defaults; data.js overrides them so
     content lives in one place. */
  function initBindings(root) {
    $$("[data-bind]", root || document).forEach(function (node) {
      var value = resolve(node.dataset.bind);
      if (value != null && value !== "") node.textContent = value;
    });

    $$("[data-bind-attr]", root || document).forEach(function (node) {
      node.dataset.bindAttr.split(",").forEach(function (pair) {
        var parts = pair.split(":");
        var attr = parts[0].trim();
        var value = resolve(parts[1].trim());
        if (value != null && value !== "") node.setAttribute(attr, value);
      });
    });
  }

  /* ---------- missing media ---------- */

  /* Artwork is not shipped with the markup, so anything that fails to load
     falls back to the flat wireframe box instead of a broken-image icon.
     Media inside a [data-frame] hides (the frame already draws a box);
     standalone images keep their footprint and go blank. */
  function initMediaFallback(root) {
    $$("img, video", root || document).forEach(function (node) {
      if (node.dataset.fallbackBound) return;
      node.dataset.fallbackBound = "1";

      node.addEventListener("error", function () {
        var frame = node.closest("[data-frame]");
        if (frame) {
          frame.classList.add("is-empty");
          node.style.display = "none";
        } else {
          node.removeAttribute("src");
          node.classList.add("is-missing");
        }
      }, true);
    });
  }

  /* ---------- boot ---------- */

  window.UI = {
    esc: esc, el: el, $: $, $$: $$,
    initMediaFallback: initMediaFallback,
    initBindings: initBindings
  };

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initNav();
    initBindings();
    splitBrand();
    initNavMotion();
    initMediaFallback();
  });
})();

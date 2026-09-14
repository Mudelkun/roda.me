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
        applyTheme(next);
        storeTheme(next);
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
    initMediaFallback();
  });
})();

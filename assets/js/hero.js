/* Hero / about section behaviour.

   Everything in here is scoped to <section class="hero">: the entrance
   stagger, the pointer-tracked background light, the bio expander, the
   copy-address action, the availability dot and the scroll cue. Nothing
   below the hero is touched, and every effect degrades to plain markup
   when JavaScript or motion is unavailable. */

(function () {
  "use strict";

  var SITE = window.SITE || {};

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function reduced() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  var hero = $(".hero");

  /* The reveal is opt-in from script: without it the markup renders at full
     opacity, so a no-JS page is never left with an invisible hero. */
  if (hero && !reduced()) hero.classList.add("can-reveal");

  /* ---------- entrance ---------- */

  function initReveal(section) {
    if (!section) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { section.classList.add("is-ready"); });
    });
  }

  /* ---------- pointer light ----------

     A single blurred circle moved with a transform, eased toward the cursor
     so it trails rather than snaps. Fine pointers only: on touch there is no
     hover to respond to, and the extra paint is not worth it. */

  function initSpot(section) {
    if (!section) return;
    var spot = $(".hero__spot", section);
    if (!spot) return;
    if (reduced() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    var tx = 0, ty = 0, x = 0, y = 0, raf = 0, seeded = false;

    function frame() {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      spot.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0) translate(-50%,-50%)";
      raf = Math.abs(tx - x) > 0.4 || Math.abs(ty - y) > 0.4 ? requestAnimationFrame(frame) : 0;
    }

    section.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var r = section.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      if (!seeded) { x = tx; y = ty; seeded = true; section.classList.add("is-tracking"); }
      if (!raf) raf = requestAnimationFrame(frame);
    }, { passive: true });

    section.addEventListener("pointerleave", function () {
      section.classList.remove("is-tracking");
      seeded = false;
    });
  }

  /* ---------- bio expander ----------

     The bio is long enough to own the hero, so it sits clamped to a few lines
     until asked. The clamp is applied here rather than in the stylesheet so a
     bio short enough to fit keeps no button, and so a no-JS page shows it
     whole. Re-measured on resize and once the webfont swaps in, since both
     change where the text wraps. */

  function initBio() {
    var bio = document.getElementById("hero-bio");
    var btn = document.getElementById("hero-bio-more");
    if (!bio || !btn) return;

    var label = $(".hero__more-t", btn) || btn;
    var open = false;
    var pending = null;

    function measure() {
      if (open) return;
      bio.classList.add("is-clamped");
      var clipped = bio.scrollHeight - bio.clientHeight > 2;
      bio.classList.toggle("is-clamped", clipped);
      btn.hidden = !clipped;
    }

    function clampedHeight() {
      bio.classList.add("is-clamped");
      var h = bio.getBoundingClientRect().height;
      bio.classList.remove("is-clamped");
      return h;
    }

    /* Animate between the two heights, then hand the paragraph back to normal
       flow so it keeps reflowing with the viewport. */
    function slide(from, to, after) {
      if (reduced()) { if (after) after(); return; }

      bio.classList.add("is-sliding");
      bio.style.maxHeight = from + "px";
      void bio.offsetHeight;
      bio.style.maxHeight = to + "px";

      var guard = null;

      function done(e) {
        if (e && e.propertyName !== "max-height") return;
        bio.removeEventListener("transitionend", done);
        clearTimeout(guard);
        bio.classList.remove("is-sliding");
        bio.style.maxHeight = "";
        if (after) after();
      }

      guard = setTimeout(done, 600);
      bio.addEventListener("transitionend", done);
    }

    btn.addEventListener("click", function () {
      var from = bio.getBoundingClientRect().height;
      open = !open;

      label.textContent = open ? "Read less" : "Read more";
      btn.setAttribute("aria-expanded", open ? "true" : "false");

      if (open) {
        bio.classList.remove("is-clamped");
        slide(from, bio.getBoundingClientRect().height);
      } else {
        slide(from, clampedHeight(), function () { bio.classList.add("is-clamped"); });
      }
    });

    window.addEventListener("resize", function () {
      clearTimeout(pending);
      pending = setTimeout(measure, 150);
    });

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    measure();
  }

  /* ---------- copy address ---------- */

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error("copy failed"));
    });
  }

  function initCopy() {
    var btn = document.getElementById("hero-copy");
    var live = document.getElementById("hero-copy-live");
    var email = SITE.profile && SITE.profile.email;

    if (!btn) return;
    if (!email) { btn.hidden = true; return; }

    btn.setAttribute("data-tip", "Copy " + email);
    btn.setAttribute("aria-label", "Copy email address " + email);

    var mail = document.getElementById("hero-email");
    if (mail) mail.setAttribute("data-tip", email);

    var reset = null;

    btn.addEventListener("click", function () {
      copyText(email).then(function () {
        btn.classList.add("is-done");
        btn.setAttribute("data-tip", "Copied");
        if (live) live.textContent = "Email address copied to the clipboard.";

        clearTimeout(reset);
        reset = setTimeout(function () {
          btn.classList.remove("is-done");
          btn.setAttribute("data-tip", "Copy " + email);
          if (live) live.textContent = "";
        }, 2200);
      }).catch(function () {
        btn.setAttribute("data-tip", email);
        if (live) live.textContent = "Could not copy. The address is " + email + ".";
      });
    });
  }

  /* ---------- availability dot ---------- */

  function initAvailability() {
    var dot = document.getElementById("hero-avail");
    if (!dot) return;
    var profile = SITE.profile || {};
    dot.hidden = !profile.openToWork;
  }

  /* ---------- github handle tooltip ---------- */

  function initHandleTip() {
    var gh = SITE.profile && SITE.profile.githubHandle;
    if (!gh) return;
    $$(".hero__actions [data-tip='GitHub']").forEach(function (node) {
      node.setAttribute("data-tip", "@" + gh);
    });
  }

  /* ---------- scroll cue ---------- */

  function initScrollCue() {
    var cue = document.getElementById("hero-scroll");
    if (!cue) return;

    var ticking = false;

    function sync() {
      ticking = false;
      cue.classList.toggle("is-gone", window.scrollY > 120);
    }

    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(sync);
    }, { passive: true });

    sync();
  }

  /* ---------- boot ---------- */

  function init() {
    initAvailability();
    initHandleTip();
    initCopy();
    initBio();
    initSpot(hero);
    initScrollCue();
    initReveal(hero);
  }

  /* The project page renders its hero after load, then binds the same
     entrance and pointer light to it. */
  window.HeroFx = {
    bind: function (section) {
      if (!section) return;
      if (!reduced()) section.classList.add("can-reveal");
      initSpot(section);
      initReveal(section);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/* Per-project branding. A project with a `brand` block in data.js is drawn in its own
   product's colours and type instead of the portfolio's: the block is turned into the
   same CSS custom properties base.css already reads (--bg, --fg, --accent, ...), scoped
   to the card or the page, plus a few --brand-* extras that brand.css consumes.

   Also the motion that comes with a branded surface: scroll reveal, a pointer-following
   glow, a slight tilt on media, crossfading screenshots and a reading-progress bar.
   All of it steps aside for prefers-reduced-motion and for touch pointers. */

(function () {
  "use strict";

  var loadedFonts = {};

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  function rgbTriple(hex) {
    var h = String(hex || "").replace("#", "");
    if (h.length === 3) h = h.replace(/./g, "$&$&");
    var n = parseInt(h, 16);
    if (h.length !== 6 || isNaN(n)) return "0 0 0";
    return (n >> 16 & 255) + " " + (n >> 8 & 255) + " " + (n & 255);
  }

  function rgba(hex, alpha) {
    return "rgb(" + rgbTriple(hex) + " / " + alpha + ")";
  }

  /* brand -> "--token: value; ..." for a style attribute. Type, radius and easing
     always come from the brand; colours only when it has a `colors` block, otherwise
     the portfolio's own palette (and its light/dark toggle) shows through. */
  function styleText(brand) {
    if (!brand) return "";
    var shape = {
      "--brand-display": brand.display,
      "--brand-body": brand.body,
      "--brand-radius": brand.radius,
      "--brand-ease": brand.ease
    };
    if (!brand.colors) return declarations(shape);

    var c = brand.colors;
    var light = brand.scheme === "light";
    var ink = light ? "#000000" : "#ffffff";

    var vars = {
      "--bg": c.bg,
      "--ground": c.raised || c.bg,
      "--panel": c.surface || c.bg,
      "--header-bg": rgba(c.bg, .78),

      "--fg": c.fg,
      "--fg-dim": c.fgDim || c.fg,
      "--fg-faint": c.fgFaint || c.fgDim || c.fg,

      "--line": rgba(ink, .16),
      "--line-soft": rgba(ink, .08),
      "--fill": rgba(ink, .04),
      "--fill-strong": rgba(ink, .07),
      "--grid": "transparent",
      "--road": "transparent",
      "--road-thin": "transparent",

      "--accent": c.accent,
      "--accent-ink": c.accentInk || c.bg,
      "--accent-text": c.accentText || c.accent,
      "--accent-wash": rgba(c.accent, .14),

      "--brand-surface": c.surface || c.bg,
      "--brand-surface-alt": c.surfaceAlt || c.surface || c.bg,
      "--brand-accent-rgb": rgbTriple(c.accent),
      "--brand-accent-2": c.accent2 || c.accent,
      "--brand-accent-2-rgb": rgbTriple(c.accent2 || c.accent),
      "--brand-grad-a": c.accent,
      "--brand-grad-b": c.accent2 || c.accent,
      "--brand-shadow": light ? "rgb(0 0 0 / .18)" : "rgb(0 0 0 / .85)",
      "--brand-sheen": rgba(ink, .04)
    };
    Object.keys(shape).forEach(function (k) { vars[k] = shape[k]; });

    return declarations(vars) + ";color-scheme:" + (light ? "light" : "dark");
  }

  function declarations(vars) {
    return Object.keys(vars).filter(function (k) { return vars[k]; }).map(function (k) {
      return k + ":" + vars[k];
    }).join(";");
  }

  function loadFonts(brand) {
    if (!brand || !brand.fonts || loadedFonts[brand.fonts]) return;
    loadedFonts[brand.fonts] = true;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = brand.fonts;
    document.head.appendChild(link);
  }

  /* Attribute string for markup built as HTML strings. */
  function attrs(brand, esc) {
    if (!brand) return "";
    loadFonts(brand);
    return ' data-brand="' + esc(brand.id || "custom") + '" style="' + esc(styleText(brand)) + '"';
  }

  /* Brand a live element (the project page brands <html>). */
  function apply(node, brand) {
    if (!node || !brand) return;
    loadFonts(brand);
    node.setAttribute("data-brand", brand.id || "custom");
    node.setAttribute("style", (node.getAttribute("style") || "") + ";" + styleText(brand));
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta && node === document.documentElement && brand.colors) meta.setAttribute("content", brand.colors.bg);
  }

  /* "Louvo: Ai Hairstyle try-on website" -> name, then the descriptor set in the
     brand's italic gradient. Titles without a colon come back as plain text. */
  function title(text, esc) {
    var s = String(text || "");
    var i = s.indexOf(":");
    if (i < 1) return esc(s);
    return '<span class="btitle__name">' + esc(s.slice(0, i + 1)) + "</span> " +
      '<em class="btitle__tail">' + esc(s.slice(i + 1).trim()) + "</em>";
  }

  /* ---------- motion ---------- */

  function reveal(root) {
    var nodes = Array.prototype.slice.call((root || document).querySelectorAll("[data-brand-reveal]"));
    if (!nodes.length) return;

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("is-in"); });
      return;
    }

    document.documentElement.classList.add("brand-motion");

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    nodes.forEach(function (n) { io.observe(n); });
  }

  /* Writes --mx/--my (0-100%) for the glow, and --rx/--ry (deg) where [data-tilt]. */
  function pointer(root) {
    if (reducedMotion.matches || !finePointer.matches) return;

    Array.prototype.slice.call((root || document).querySelectorAll("[data-glow], [data-tilt]")).forEach(function (node) {
      var frame = 0;
      var tilt = node.hasAttribute("data-tilt") ? Number(node.getAttribute("data-tilt")) || 4 : 0;

      node.addEventListener("pointermove", function (e) {
        if (frame) return;
        frame = requestAnimationFrame(function () {
          frame = 0;
          var r = node.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width;
          var y = (e.clientY - r.top) / r.height;
          node.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
          node.style.setProperty("--my", (y * 100).toFixed(1) + "%");
          if (tilt) {
            node.style.setProperty("--rx", ((.5 - y) * tilt).toFixed(2) + "deg");
            node.style.setProperty("--ry", ((x - .5) * tilt).toFixed(2) + "deg");
          }
          node.classList.add("is-pointer");
        });
      });

      node.addEventListener("pointerleave", function () {
        node.classList.remove("is-pointer");
        node.style.setProperty("--rx", "0deg");
        node.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* Crossfading screenshots. Markup: [data-slides] holding .bslides__img elements,
     optional [data-slide-to] buttons and an optional [data-slide-cap]. Advances on its
     own while on screen, pauses under the pointer or keyboard focus. A slide with
     data-hold="ms" stays up that long instead of the box's interval. */
  function slides(root) {
    Array.prototype.slice.call((root || document).querySelectorAll("[data-slides]")).forEach(function (box) {
      var imgs = Array.prototype.slice.call(box.querySelectorAll(".bslides__img"));
      if (imgs.length < 2) return;

      var scope = box.closest("[data-slides-scope]") || box;
      var dots = Array.prototype.slice.call(scope.querySelectorAll("[data-slide-to]"));
      var cap = scope.querySelector("[data-slide-cap]");
      var interval = Number(box.getAttribute("data-slides")) || 3800;
      var index = 0;
      var timer = 0;
      var visible = false;
      var held = false;

      function show(i) {
        index = (i + imgs.length) % imgs.length;
        imgs.forEach(function (img, n) { img.classList.toggle("is-active", n === index); });
        dots.forEach(function (d, n) {
          d.classList.toggle("is-active", n === index);
          d.setAttribute("aria-pressed", n === index ? "true" : "false");
        });
        if (cap) cap.textContent = imgs[index].getAttribute("data-caption") || "";
        box.setAttribute("data-index", String(index));
      }

      function schedule() {
        clearTimeout(timer);
        if (reducedMotion.matches || !visible || held || document.hidden) return;
        var hold = Number(imgs[index].getAttribute("data-hold")) || interval;
        timer = setTimeout(function () { show(index + 1); schedule(); }, hold);
      }

      dots.forEach(function (d) {
        d.addEventListener("click", function (e) {
          e.stopPropagation();
          show(Number(d.getAttribute("data-slide-to")));
          schedule();
        });
      });

      scope.addEventListener("pointerenter", function () { held = true; schedule(); });
      scope.addEventListener("pointerleave", function () { held = false; schedule(); });
      scope.addEventListener("focusin", function () { held = true; schedule(); });
      scope.addEventListener("focusout", function () { held = false; schedule(); });
      document.addEventListener("visibilitychange", schedule);

      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
          schedule();
        }, { threshold: 0.35 }).observe(box);
      } else {
        visible = true;
      }

      show(0);
      schedule();
    });
  }

  function progress(bar) {
    if (!bar) return;
    var frame = 0;
    function update() {
      frame = 0;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
    }
    function onScroll() { if (!frame) frame = requestAnimationFrame(update); }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  function interact(root) {
    reveal(root);
    pointer(root);
    slides(root);
  }

  window.Brand = {
    attrs: attrs,
    apply: apply,
    title: title,
    interact: interact,
    slides: slides,
    progress: progress
  };
})();

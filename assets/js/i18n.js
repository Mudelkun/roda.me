/* French layer, done procedurally: nothing on this site is written twice.

   The module reads whatever text is on the page - markup, anything rendered from
   data.js, chat replies, GitHub status lines - sends the strings it has never seen
   to a translation endpoint, and writes the answers back in place. Every string it
   gets back is kept in localStorage, so the first switch costs a few seconds and
   every one after that is instant, including on later visits.

   Because it works off the live DOM and keeps a MutationObserver running, content
   added to data.js later is translated by itself: there is no list here to update.

   Switching back to English restores the original strings from memory, so the
   English side is never a translation of a translation.

   Config lives in SITE.translate (see data.js). */

(function () {
  "use strict";

  var SITE = window.SITE || {};
  var CFG = SITE.translate || {};

  var LANG = CFG.lang || "fr";
  var SOURCE = CFG.source || "en";
  var STORE_KEY = "roda-lang";
  var CACHE_KEY = "roda-i18n-" + SOURCE + "-" + LANG;
  var CACHE_MAX = 1500;
  var LANES = CFG.lanes || 6;

  /* ---------- what never gets sent ---------- */

  var SKIP_TAGS = {
    SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, CODE: 1, PRE: 1, TEXTAREA: 1,
    SVG: 1, CANVAS: 1, IFRAME: 1, TEMPLATE: 1, OPTION: 1
  };

  var ATTRS = ["aria-label", "title", "placeholder", "alt", "data-tip", "data-caption"];

  var HAS_WORD = /[A-Za-zÀ-ÖØ-öø-ÿ]{2,}/;
  var IS_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var IS_URL = /^(https?:\/\/|www\.|@)\S+$/i;
  var IS_HANDLE = /^@\S+$/;

  /* Proper nouns and product names. Built from the content itself - project titles,
     tags and stack items - so adding a technology to data.js protects it too. */
  var protect = (function () {
    var set = {};
    function add(value) {
      if (typeof value === "string" && value.trim()) set[value.trim().toLowerCase()] = 1;
    }

    var p = SITE.profile || {};
    add(p.name);
    add(p.githubHandle);
    add(p.githubHandle ? "@" + p.githubHandle : null);
    add(p.email);

    (SITE.projects || []).forEach(function (project) {
      (project.tags || []).forEach(add);
      (project.stack || []).forEach(function (layer) { (layer.items || []).forEach(add); });
      if (project.brand && project.brand.id) add(project.brand.id);
    });

    (CFG.protect || []).forEach(add);
    return set;
  })();

  /* "Formel" is protected, and so is "Formel:" - without this the colon is enough
     to make it a normal word again, and the product comes back as "Formule". */
  var EDGES = /^[\s"'“”«»(\[]+|[\s"'“”«»)\]:;,.!?·—–-]+$/g;

  function protectedText(text) {
    var bare = text.replace(EDGES, "");
    return protect[text.toLowerCase()] === 1 || (bare !== "" && protect[bare.toLowerCase()] === 1);
  }

  /* A string is worth a round trip only if it reads as language. */
  function translatable(text) {
    if (text.length < 2 || text.length > 4000) return false;
    if (!HAS_WORD.test(text)) return false;
    if (IS_EMAIL.test(text) || IS_URL.test(text) || IS_HANDLE.test(text)) return false;
    return !protectedText(text);
  }

  function skipEl(node) {
    if (SKIP_TAGS[node.tagName]) return true;
    if (node.getAttribute("translate") === "no") return true;
    return node.hasAttribute("data-no-i18n");
  }

  /* ---------- cache ---------- */

  /* assets/js/i18n-cache.js, if it is loaded, holds the strings already translated
     by tools/warm-i18n.js. It is generated, never written by hand, and it means the
     common case costs no requests at all - the module only goes to the network for
     text added since the file was built. */
  var seed = window.I18N_CACHE || {};

  /* Only what this browser fetched itself is persisted; the seed is already on disk. */
  var cache = (function () {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; } catch (e) { return {}; }
  })();

  function known(key) {
    return cache[key] || seed[key];
  }

  var cacheDirty = false;

  /* Lines that differ only by a number - "updated 4s ago", "updated 5s ago",
     "900 contributions in the last 12 months" - share one shape, translated once.
     The digits are slotted back in afterwards, so a ticking counter costs a single
     request instead of one per tick. */
  var NUMS = /\d[\d.,\u202f\u00a0\s]*\d|\d/g;
  var SLOT = "\u0001";
  var SLOTS = /\u0001/g;

  function shape(text) {
    return text.replace(NUMS, SLOT);
  }

  function fill(template, text) {
    var numbers = text.match(NUMS) || [];
    var i = 0;
    var out = template.replace(SLOTS, function () { return numbers[i++] || ""; });
    return i === numbers.length ? out : null;
  }

  /* Short labels carry no sentence for a translator to read, so a few come back
     wrong: "May" as the verb, "Wed" as "marry". SITE.translate.overrides settles
     those by hand; everything else is left to the provider. A key may carry {n}
     where a number varies, so one entry covers every count. */
  var overrides = {};
  var shapedOverrides = {};

  Object.keys(CFG.overrides || {}).forEach(function (key) {
    var value = CFG.overrides[key];
    if (key.indexOf("{n}") === -1) { overrides[key] = value; return; }

    // Shaped on both sides: a literal number left in the line becomes a slot too,
    // so "{n} contributions in the last 12 months" still matches what is on screen.
    shapedOverrides[shape(key.split("{n}").join(SLOT))] = shape(value.split("{n}").join(SLOT));
  });

  function lookup(en) {
    if (overrides[en]) return overrides[en];

    var direct = known(en);
    if (direct) return direct;

    var key = shape(en);
    if (key === en) return null;

    var template = shapedOverrides[key] || known(SLOT + key);
    return template ? fill(template, en) : null;
  }

  function remember(en, out) {
    cache[en] = out;
    cacheDirty = true;

    // Keep the shape too, but only when the translation kept every number.
    var key = shape(en);
    if (key === en) return;
    var template = shape(out);
    if ((out.match(NUMS) || []).length === (en.match(NUMS) || []).length) cache[SLOT + key] = template;
  }

  function flushCache() {
    if (!cacheDirty) return;
    cacheDirty = false;
    try {
      var keys = Object.keys(cache);
      if (keys.length > CACHE_MAX) {
        var trimmed = {};
        keys.slice(keys.length - CACHE_MAX).forEach(function (k) { trimmed[k] = cache[k]; });
        cache = trimmed;
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) { /* private mode or quota - the page still works, just not cached */ }
  }

  /* ---------- providers ---------- */

  /* Tried in order, first one to answer wins - the same arrangement the GitHub
     graph uses. Both are public, key-less and CORS-open. */
  var PROVIDERS = {
    google: {
      url: function (text, from, to) {
        return "https://translate.googleapis.com/translate_a/single?client=gtx" +
          "&sl=" + from + "&tl=" + to + "&dt=t&q=" + encodeURIComponent(text);
      },
      read: function (data) {
        if (!data || !data[0]) return "";
        return data[0].map(function (part) { return (part && part[0]) || ""; }).join("");
      },

      /* Many strings in one request. The reply carries the source next to each
         translation, so the pairs are matched by that echo rather than by position -
         if anything comes back that cannot be matched, the batch is discarded and
         the strings are fetched one by one. */
      batchUrl: function (texts, from, to) {
        return "https://translate.googleapis.com/translate_a/single?client=gtx" +
          "&sl=" + from + "&tl=" + to + "&dt=t" +
          texts.map(function (t) { return "&q=" + encodeURIComponent(t); }).join("");
      },
      readBatch: function (data, texts) {
        var pairs = {};

        (function scan(node) {
          if (!node || typeof node !== "object") return;
          if (typeof node[0] === "string" && typeof node[1] === "string") {
            pairs[node[1].trim()] = node[0];
            return;
          }
          for (var i = 0; i < node.length; i++) scan(node[i]);
        })(data);

        var out = [];
        for (var i = 0; i < texts.length; i++) {
          var hit = pairs[texts[i].trim()];
          if (!hit) return null;
          out.push(hit);
        }
        return out;
      }
    },
    mymemory: {
      url: function (text, from, to) {
        return "https://api.mymemory.translated.net/get?langpair=" +
          from + "|" + to + "&q=" + encodeURIComponent(text);
      },
      read: function (data) {
        var out = data && data.responseData && data.responseData.translatedText;
        if (!out || /^[A-Z ]*(INVALID|QUERY LENGTH|MYMEMORY WARNING)/.test(out)) return "";
        return out;
      }
    }
  };

  var order = (CFG.providers || ["google", "mymemory"]).filter(function (id) { return PROVIDERS[id]; });
  var preferred = null;

  /* A provider that just refused - rate limit, outage, blocked origin - is stood
     down for a while instead of being asked again for every remaining string. If
     they are all down, the ban is ignored and they get tried anyway. */
  var REST = CFG.retryAfter || 60000;
  var benched = {};

  function bench(id) {
    benched[id] = Date.now() + REST;
  }

  function live(ids) {
    var now = Date.now();
    var up = ids.filter(function (id) { return !benched[id] || benched[id] < now; });
    return up.length ? up : ids;
  }

  function ranked() {
    var ids = preferred
      ? [preferred].concat(order.filter(function (id) { return id !== preferred; }))
      : order.slice();
    return live(ids);
  }

  /* Providers hand back HTML entities - "Activité&#160;" - and these strings are
     written as text, so they have to be decoded or the markup shows through. */
  var decoder = document.createElement("textarea");

  function decode(text) {
    if (text.indexOf("&") === -1) return text;
    decoder.innerHTML = text;
    return decoder.value;
  }

  /* Both providers reject long text - one of them caps a request at 500 bytes - and
     the bio and the write-ups are well past that. Anything oversized is cut on
     sentence boundaries, translated piece by piece and joined back together. */
  var MAX = CFG.maxChars || 420;

  function sentences(text) {
    var pieces = text.match(/[^.!?…]+[.!?…]*\s*/g) || [text];
    var out = [];
    var buf = "";

    pieces.forEach(function (piece) {
      if (buf && (buf + piece).length > MAX) { out.push(buf); buf = ""; }

      if (piece.length > MAX) {
        // One sentence longer than the cap: fall back to breaking on spaces.
        piece.split(/(\s+)/).forEach(function (word) {
          if (buf && (buf + word).length > MAX) { out.push(buf); buf = ""; }
          buf += word;
        });
        return;
      }
      buf += piece;
    });

    if (buf.trim()) out.push(buf);
    return out;
  }

  /* Only a refusal by the service counts against it. A string it simply could not
     handle is the string's problem, not the provider's. */
  function transportError(reason) {
    var err = new Error(reason);
    err.transport = true;
    return err;
  }

  function fetchFrom(id, text, from, to) {
    var provider = PROVIDERS[id];
    return fetch(provider.url(text, from, to), { mode: "cors" })
      .then(function (r) {
        if (!r.ok) throw transportError(r.status);
        return r.json();
      }, function () { throw transportError("network"); })
      .then(function (data) {
        var out = decode(String(provider.read(data) || "")).trim();
        if (!out) throw new Error("empty");
        return out;
      });
  }

  /* One string, whichever provider answers. The one that worked is tried first from
     then on, so a dead endpoint costs one failure per lane rather than one per string. */
  var inflight = {};

  /* A string rides in a batch when it is short and reads as a single sentence: one
     sentence in, one translation back, which is what makes the echo match reliable. */
  var BATCH_MAX = CFG.batchSize || 24;
  var BATCH_CHARS = CFG.batchChars || 1400;

  function canBatch(text) {
    return text.length <= 200 && !/[.!?…]\s/.test(text);
  }

  function groupBatches(texts) {
    var batches = [];
    var buf = [];
    var size = 0;

    texts.forEach(function (text) {
      var cost = encodeURIComponent(text).length + 3;
      if (buf.length && (buf.length >= BATCH_MAX || size + cost > BATCH_CHARS)) {
        batches.push(buf); buf = []; size = 0;
      }
      buf.push(text);
      size += cost;
    });

    if (buf.length) batches.push(buf);
    return batches;
  }

  function fetchBatch(id, texts, from, to) {
    var provider = PROVIDERS[id];
    if (!provider || !provider.batchUrl) return Promise.reject(new Error("no batch"));

    return fetch(provider.batchUrl(texts, from, to), { mode: "cors" })
      .then(function (r) {
        if (!r.ok) { bench(id); throw transportError(r.status); }
        return r.json();
      }, function () { bench(id); throw transportError("network"); })
      .then(function (data) {
        var out = provider.readBatch(data, texts);
        if (!out) throw new Error("unaligned");
        return out.map(function (value) { return decode(String(value || "")).trim(); });
      });
  }

  function askProviders(text, from, to) {
    return ranked().reduce(function (chain, id) {
      return chain.catch(function () {
        return fetchFrom(id, text, from, to).then(function (out) {
          preferred = id;
          delete benched[id];
          return out;
        }, function (err) {
          if (err && err.transport) bench(id);
          throw err;
        });
      });
    }, Promise.reject());
  }

  function translateOne(text, from, to) {
    var key = from + ">" + to + ":" + text;
    if (inflight[key]) return inflight[key];

    var parts = text.length > MAX ? sentences(text) : [text];

    var job = parts.length === 1
      ? askProviders(text, from, to)
      : Promise.all(parts.map(function (part) {
          return askProviders(part.trim(), from, to);
        })).then(function (out) { return out.join(" "); });

    // A pass can start while another is still in the air; the same string is only
    // ever one request.
    inflight[key] = job;
    job.catch(function () {}).then(function () { delete inflight[key]; });
    return job;
  }

  function pool(items, limit, worker) {
    return new Promise(function (resolve) {
      if (!items.length) { resolve(); return; }
      var next = 0;
      var done = 0;

      function start() {
        while (next < items.length && next - done < limit) {
          worker(items[next++]).then(finish, finish);
        }
      }

      function finish() {
        done++;
        if (done === items.length) resolve();
        else start();
      }

      start();
    });
  }

  /* ---------- reading the page ---------- */

  /* Each entry is one place on the page holding one string: a text node, or one
     attribute of an element. The English original rides along so the switch back
     is exact. */
  function collect(root, out) {
    if (!root) return out;

    if (root.nodeType === 3) {
      readText(root, out);
      return out;
    }

    if (root.nodeType !== 1 || skipEl(root)) return out;

    readAttrs(root, out);
    for (var child = root.firstChild; child; child = child.nextSibling) collect(child, out);
    return out;
  }

  function readText(node, out) {
    var raw = node.nodeValue;
    if (!raw || node.__i18nOut === raw) return;

    var text = raw.trim();
    if (!translatable(text)) return;

    // Surrounding whitespace is kept so inline spacing survives the swap.
    var lead = raw.match(/^\s*/)[0];
    out.push({
      node: node,
      attr: null,
      en: text,
      lead: lead,
      trail: raw.slice(lead.length + text.length)
    });
  }

  function readAttrs(el, out) {
    var written = el.__i18nAttrOut || {};

    ATTRS.forEach(function (attr) {
      if (!el.hasAttribute(attr)) return;
      var raw = el.getAttribute(attr);
      if (!raw || written[attr] === raw) return;

      var text = raw.trim();
      if (!translatable(text)) return;
      out.push({ node: el, attr: attr, en: text, lead: "", trail: "" });
    });
  }

  /* ---------- writing it back ---------- */

  var tracked = [];
  var writing = false;
  var observer = null;

  function write(entry, value) {
    if (entry.attr) {
      entry.node.setAttribute(entry.attr, value);
      entry.node.__i18nAttrOut = entry.node.__i18nAttrOut || {};
      entry.node.__i18nAttrOut[entry.attr] = value;
    } else {
      entry.node.nodeValue = entry.lead + value + entry.trail;
      entry.node.__i18nOut = entry.node.nodeValue;
    }
  }

  function silently(fn) {
    writing = true;
    try { fn(); } finally {
      if (observer) observer.takeRecords();
      writing = false;
    }
  }

  function restore() {
    silently(function () {
      tracked.forEach(function (entry) {
        if (entry.attr) {
          if (entry.node.isConnected) entry.node.setAttribute(entry.attr, entry.en);
          if (entry.node.__i18nAttrOut) delete entry.node.__i18nAttrOut[entry.attr];
        } else {
          if (entry.node.__i18nOut === entry.node.nodeValue) entry.node.nodeValue = entry.lead + entry.en + entry.trail;
          delete entry.node.__i18nOut;
        }
      });
    });
    tracked = [];
  }

  /* ---------- the pass ---------- */

  var running = null;

  /* The tab title and the description a link preview shows are part of the page too. */
  function readHead(out) {
    collect(document.querySelector("title"), out);

    var meta = document.querySelector('meta[name="description"]');
    if (!meta) return;
    var raw = meta.getAttribute("content") || "";
    var text = raw.trim();
    var written = meta.__i18nAttrOut || {};
    if (written.content === raw || !translatable(text)) return;
    out.push({ node: meta, attr: "content", en: text, lead: "", trail: "" });
  }

  function pass() {
    var entries = collect(document.body, []);
    readHead(entries);
    if (!entries.length) return Promise.resolve(0);

    var misses = [];
    var seen = {};
    entries.forEach(function (entry) {
      if (lookup(entry.en) || seen[entry.en]) return;
      seen[entry.en] = 1;
      misses.push(entry.en);
    });

    var failed = 0;

    function single(text) {
      return translateOne(text, SOURCE, LANG)
        .then(function (out) { remember(text, out); })
        .catch(function () { failed++; });
    }

    /* Short labels travel together; long paragraphs go on their own. */
    var jobs = groupBatches(misses.filter(canBatch)).map(function (texts) {
      return function () {
        if (texts.length === 1) return single(texts[0]);

        return fetchBatch(ranked()[0], texts, SOURCE, LANG).then(function (out) {
          out.forEach(function (value, i) {
            if (value) remember(texts[i], value);
            else failed++;
          });
        }).catch(function () {
          // Batch refused or came back unmatched: ask for each string on its own.
          return Promise.all(texts.map(single));
        });
      };
    });

    misses.filter(function (text) { return !canBatch(text); }).forEach(function (text) {
      jobs.push(function () { return single(text); });
    });

    return pool(jobs, LANES, function (job) { return job(); }).then(function () {
      flushCache();

      var written = 0;
      silently(function () {
        entries.forEach(function (entry) {
          var out = lookup(entry.en);
          if (!out || out === entry.en) return;
          write(entry, out);
          tracked.push(entry);
          written++;
        });
      });

      // The nav pill and the header progress bar are sized from the old English
      // labels; a resize is what they already listen for.
      if (written) window.dispatchEvent(new Event("resize"));

      // Not one request got through: no provider is reachable. Only the pass behind
      // the click acts on this - later passes just leave the odd string in English.
      if (misses.length && failed === misses.length) throw new Error("unreachable");
      return entries.length;
    });
  }

  /* Anything rendered after the switch - project cards, the detail page, a chat
     reply, the GitHub status line - is picked up here. */
  function watch() {
    if (observer) return;
    var timer = null;

    observer = new MutationObserver(function () {
      if (writing || !isOn()) return;
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (isOn()) pass().catch(function () { /* keep whatever is already translated */ });
      }, 180);
    });

    /* Attributes are watched too: hero.js rewrites the copy button's tooltip after
       the page settles, and github.js relabels the graph on every poll. */
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS
    });
  }

  /* ---------- the switch ---------- */

  function isOn() {
    return document.documentElement.getAttribute("lang") === LANG;
  }

  function buttons() {
    return Array.prototype.slice.call(document.querySelectorAll(".lang-toggle"));
  }

  function paint(state) {
    buttons().forEach(function (btn) {
      btn.setAttribute("aria-pressed", isOn() ? "true" : "false");
      btn.setAttribute("aria-label", isOn() ? "Switch the site back to English" : "Traduire le site en français");
      if (state) btn.setAttribute("data-state", state);
      else btn.removeAttribute("data-state");
      btn.setAttribute("aria-busy", state === "busy" ? "true" : "false");
    });
  }

  function store(value) {
    try { localStorage.setItem(STORE_KEY, value); } catch (e) { /* private mode */ }
  }

  function set(lang, options) {
    var opts = options || {};

    if (lang !== LANG) {
      document.documentElement.setAttribute("lang", SOURCE);
      restore();
      if (!opts.quiet) store(SOURCE);
      paint();
      return Promise.resolve();
    }

    document.documentElement.setAttribute("lang", LANG);
    if (!opts.quiet) store(LANG);
    paint("busy");
    watch();

    running = pass().then(function () {
      paint();
    }).catch(function () {
      // No provider answered: back to English rather than half a page.
      document.documentElement.setAttribute("lang", SOURCE);
      restore();
      store(SOURCE);
      paint("error");
      setTimeout(paint, 4000);
    });

    return running;
  }

  function toggle() {
    return set(isOn() ? SOURCE : LANG);
  }

  /* The chat matches on English keywords, so a French question goes back through
     the same providers before it is answered. */
  function toSource(text) {
    var key = "←" + text;
    if (!isOn()) return Promise.resolve(text);
    if (cache[key]) return Promise.resolve(cache[key]);

    return translateOne(text, LANG, SOURCE).then(function (out) {
      remember(key, out);
      flushCache();
      return out;
    }).catch(function () { return text; });
  }

  window.I18N = {
    lang: LANG,
    isOn: isOn,
    set: set,
    toggle: toggle,
    toSource: toSource,
    ready: function () { return running || Promise.resolve(); }
  };

  document.addEventListener("DOMContentLoaded", function () {
    if (CFG.enabled === false) {
      buttons().forEach(function (btn) { btn.hidden = true; });
      return;
    }

    buttons().forEach(function (btn) {
      btn.addEventListener("click", function () { toggle(); });
    });

    var stored = null;
    try { stored = localStorage.getItem(STORE_KEY); } catch (e) { /* private mode */ }

    paint();
    if (stored === LANG) set(LANG, { quiet: true });
  });
})();
